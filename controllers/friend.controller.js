const router = require('express').Router();
const Account = require('../models/account.model');
const FriendRequest = require('../models/friendrequest.model');
const FriendList = require('../models/friendlist.model');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

router.post('/get_list_suggested_friends', async (req,resp) => {
  let token = req.body.token;
  let index = req.body.index;
  let count = req.body.count;
  let payload = jwt.verify(req.body.token, process.env.TOKEN_SECRET);
  let requestUserId = payload.userId;

  // tham số index hoặc count không phải là kiểu number
  if ((isNaN(index - 0)) || (isNaN(count - 0))) {
    resp.json({
      code: 1003,
      message: 'parameter type is invalid',
    });
    return;
  }

  let requestUserObjectId = new mongoose.Types.ObjectId(requestUserId);
  let friendList = await FriendList.aggregate([
    {$match: {$or: [{user1_id: requestUserObjectId}, {user2_id: requestUserObjectId}]}},
    {$project: {_id: 0, u: ["$user1_id", "$user2_id"]}},
    {$unwind: "$u"},
    {$match: {u: {$ne: requestUserObjectId}}},
    {$project: {u: 1}}
  ]);

  notSuggestedList = friendList.map(friend => (friend.u).toString());
  // thieu nguoi dung bi block can bo sung
  notSuggestedList.push(requestUserId);


  suggestedFriends = await Account.find( {_id: {$nin: notSuggestedList }}).skip(parseInt(index)).limit(parseInt(count));
  console.log(suggestedFriends);

  let suggestedFriendData = await Promise.all(suggestedFriends.map((friend) => mapSuggestedFriends(requestUserId, friend)));
  console.log(suggestedFriendData);
  resp.json({
    code: 1000,
    message: 'OK',
    data: {
      list_users: suggestedFriendData
    }
  });
});

router.post('/get_user_friends', async (req,resp) => {
  let token = req.body.token;
  let friendUserId = req.body.user_id;
  let index = req.body.index;
  let count = req.body.count;
  let payload = jwt.verify(req.body.token, process.env.TOKEN_SECRET);
  let requestUserId = payload.userId;

  // tham số index hoặc count không phải là kiểu number
  if ((isNaN(index - 0)) || (isNaN(count - 0))) {
    resp.json({
      code: 1003,
      message: 'parameter type is invalid',
    });
    return;
  }

  // nếu không tìm thấy user_id trong parameter thì tìm danh sách bạn của người gửi trong token
  if (!friendUserId) {
    friendUserId = requestUserId;
  }

  // user_id không phải là ObjectId type
  if (!mongoose.Types.ObjectId.isValid(friendUserId)) {
    resp.json({
      code: 1004,
      message: 'parameter value is invalid',
    });
    return;
  }

  // tìm userId
  let friendUser = await Account.findOne({_id: friendUserId});
  // khong tim thay user_id trong database
  if(!friendUser){
    resp.json({
      code: 9995,
      message: 'user is not validated',
    });
    return;
  }

  let friendUserObjectId = new mongoose.Types.ObjectId(friendUserId);
  let friendUserList = await FriendList.aggregate([
    {$match: {$or: [{user1_id: friendUserObjectId}, {user2_id: friendUserObjectId}]}},
    {$project: {_id: 0, createdTime: 1, u: ["$user1_id", "$user2_id"]}},
    {$unwind: "$u"},
    {$match: {u: {$ne: friendUserObjectId}}},
    {$project: {u: 1, requestAccount: requestUserId, createdTime: 1}}
  ]);
  let friendData = await Promise.all(friendUserList.map(mapFriendUserList));
  console.log(friendData);
  resp.json({
    code: 1000,
    message: 'OK',
    data: {
      friends: friendData,
      total: friendData.length,
    }
  });
});

router.post('/get_requested_friends', async (req, resp) => {
  let token = req.body.token;
  let index = req.body.index;
  let count = req.body.count;
  let payload = jwt.verify(token, process.env.TOKEN_SECRET);
  let accountGetRequestId = payload.userId;

  // tham số index hoặc count không phải là kiểu number
  if ((isNaN(index - 0)) || (isNaN(count - 0))) {
    resp.json({
      code: 1003,
      message: 'parameter type is invalid',
    });
    return;
  }

  let accountSendRequest = await FriendRequest.find({userGetRequest_id: accountGetRequestId}).skip(parseInt(index)).limit(parseInt(count));
  let requestData = await Promise.all(accountSendRequest.map(mapUserInfo));
  resp.json({
    code: 1000,
    message: 'OK',
    data: {
      request: requestData,
      total: requestData.length,
    }
  });
  return;
});

router.post('/set_request_friend', async (req, resp) => {
  let token = req.body.token;
  let user_id = req.body.user_id;

  let payload = jwt.verify(req.body.token, process.env.TOKEN_SECRET);
  let accountRequest_id = payload.userId;
  let userGetRequest;
  if (mongoose.Types.ObjectId.isValid(user_id)){
    userGetRequest = await Account.findOne({_id: user_id});
  }

  let requested_friends = await FriendRequest.countDocuments({userSendRequest_id: accountRequest_id});

  // user_id khong khop voi user nao trong database
  // hoac nguoi gui ket ban va nguoi nhan la cung mot nguoi
  // user_id khong phai la ObjectID
  if ((!userGetRequest)
    || (user_id == accountRequest_id)
    || (!mongoose.Types.ObjectId.isValid(user_id))) {
      resp.json({
        code: 1004,
        message: 'parameter value is invalid',
        data: {
          requested_friends: requested_friends,
        },
      });
      return;
  }

  // Da gui ket ban cho user_id ma lai gui lai lan nua, coi nhu huy yeu cau ket ban
  let deletedRequest = await FriendRequest.findOneAndDelete({userSendRequest_id: accountRequest_id, userGetRequest_id: user_id});
  if (deletedRequest) {
    resp.json({
      code: 1000,
      message: 'OK',
      data: {
        requested_friends: requested_friends - 1,
      }
    });
    return;
  }

  //sai, toi da 500 ban chu ko phai request, de lam sau[]
  // thoa man toi da 500 request
  if (requested_friends < 500){
    await new FriendRequest({
  		userSendRequest_id: accountRequest_id,
  		userGetRequest_id: user_id,
      createdTime: Date.now(),
  	}).save();
    resp.json({
      code: 1000,
      message: 'OK',
      data: {
        requested_friends: requested_friends + 1,
      },
    });
  } else {
    resp.json({
      code: 9994,
      message: 'no data or end of list data',
      data: {
        requested_friends: requested_friends
      },
    })
  }
});

router.post('/set_accept_friend', async (req, resp) => {
  let token = req.body.token;
  let accountRequestId = req.body.user_id;
  let isAccept = req.body.is_accept;

  let payload = jwt.verify(req.body.token, process.env.TOKEN_SECRET);
  let accountAcceptId = payload.userId;

  //user_id tham so khong thuoc kieu ObjectId
  // is_accept  khong phai la 0 hoac 1
  if ((!mongoose.Types.ObjectId.isValid(accountRequestId))
    || ((isAccept != '0') && (isAccept != '1'))
  ){
    resp.json({
      code: 1004,
      message: 'parameter value is invalid',
    });
    return;
  }

  let accountRequest = await Account.findOne({_id: accountRequestId});
  // khong tim thay user_id trong database
  if(!accountRequest){
    resp.json({
      code: 9995,
      message: 'user is not validated',
    });
    return;
  }

  //Da chap thuan hoac xoa bo yeu cau ket ban roi
  let friendRequest = await FriendRequest.findOne({userSendRequest_id: accountRequestId, userGetRequest_id: accountAcceptId});
  if (!friendRequest){
    resp.json({
      code: 1010,
      message: 'Action has been done previously by this user',
    });
    return;
  }

  // chấp nhận yêu cầu kết bạn
  if (isAccept == "1") {
    //Them ban
    await new FriendList({
      user1_id: accountRequestId,
      user2_id: accountAcceptId,
    }).save();
  }

  //Xóa yêu cầu kết bạn khi chấp nhận kết bạn hoặc không chấp nhận yêu cầu kết bạn
  await FriendRequest.findOneAndDelete({userSendRequest_id: accountRequestId, userGetRequest_id: accountAcceptId});
  resp.json({
    code: 1000,
    message: 'OK',
  });
});

async function mapSuggestedFriends(requestAccountId, friend){

  let friendId = friend._id;

  // Đếm số bạn chung của account gửi yêu cầu kết bạn và account nhận yêu cầu kết bạn
  let mutual = [new mongoose.Types.ObjectId(requestAccountId), new mongoose.Types.ObjectId(friendId)];
  let listSameFriend = await FriendList.aggregate([
    {$match: {$or: [{user1_id: {$in: mutual}}, {user2_id: {$in: mutual}}]}},
    {$project: {_id: 0, u: ["$user1_id", "$user2_id"]}},
    {$unwind: "$u"},
    {$match: {u: {$nin: mutual}}},
    {$group: {_id: "$u", count: {$sum: 1}}},
    {$match: {count: 2}},
    {$project: {_id: 1}}
  ]);
  countSameFriend = listSameFriend.length;
	return {
    user_id: friend._id,
    username: friend.name,
    avatar: friend.avatar.url,
    same_friends: countSameFriend,
	}
}

async function mapFriendUserList(friend){
	let accountId = friend.requestAccount;
  let friendOfAccountId = friend.u;
  let friendOfAccount = await Account.findOne({_id:friendOfAccountId});

  // Đếm số bạn chung của account gửi yêu cầu kết bạn và account nhận yêu cầu kết bạn
  let mutual = [new mongoose.Types.ObjectId(accountId), new mongoose.Types.ObjectId(friendOfAccountId)];
  let listSameFriend = await FriendList.aggregate([
    {$match: {$or: [{user1_id: {$in: mutual}}, {user2_id: {$in: mutual}}]}},
    {$project: {_id: 0, u: ["$user1_id", "$user2_id"]}},
    {$unwind: "$u"},
    {$match: {u: {$nin: mutual}}},
    {$group: {_id: "$u", count: {$sum: 1}}},
    {$match: {count: 2}},
    {$project: {_id: 1}}
  ]);
  countSameFriend = listSameFriend.length;
	return {
    id: friendOfAccount._id,
    username: friendOfAccount.name,
    avatar: friendOfAccount.avatar.url,
    same_friends: countSameFriend,
    created: friend.createdTime,
	}
}

async function mapUserInfo(request){
	let accountSendRequestId = request.userSendRequest_id;
  let accountGetRequestId = request.userGetRequest_id;
  let accountSendRequest = await Account.findOne({_id:accountSendRequestId});

  // Đếm số bạn chung của account gửi yêu cầu kết bạn và account nhận yêu cầu kết bạn
  let mutual = [new mongoose.Types.ObjectId(accountSendRequestId), new mongoose.Types.ObjectId(accountGetRequestId)];
  let listSameFriend = await FriendList.aggregate([
    {$match: {$or: [{user1_id: {$in: mutual}}, {user2_id: {$in: mutual}}]}},
    {$project: {_id: 0, u: ["$user1_id", "$user2_id"]}},
    {$unwind: "$u"},
    {$match: {u: {$nin: mutual}}},
    {$group: {_id: "$u", count: {$sum: 1}}},
    {$match: {count: 2}},
    {$project: {_id: 1}}
  ]);
  countSameFriend = listSameFriend.length;

	return {
    id: accountSendRequest._id,
    username: accountSendRequest.name,
    avatar: accountSendRequest.avatar.url,
    same_friends: countSameFriend,
    created: request.createdTime,
	}
}

module.exports = router;