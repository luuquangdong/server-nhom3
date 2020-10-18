const router = require('express').Router();
const Account = require('../models/account.model');
const FriendRequest = require('../models/friendrequest.model');
const FriendList = require('../models/friendlist.model');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

router.post('/get_requested_friends', async (req, resp) => {

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

  //Them ban
  await new FriendList({
    user1_id: accountRequestId,
    user2_id: accountAcceptId,
  }).save();

  //Xoa yeu cau ket ban sau khi them ban
  await FriendRequest.findOneAndDelete({userSendRequest_id: accountRequestId, userGetRequest_id: accountAcceptId});
  resp.json({
    code: 1000,
    message: 'OK',
  });



});


module.exports = router;
