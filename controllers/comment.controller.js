const router = require('express').Router();

const Account = require('../models/account.model');
const Post = require('../models/post.model');
const Comment = require('../models/comment.model');
const FriendBlock = require('../models/friendblock.model');

router.post('/set_comment', async (req, resp) => {
	// kiểm tra khóa tài khoản ng dùng
	if(req.account.isBlock){
		return resp.json({
			code: 9991,
			message: "User is blocked"
		});
	}
	// kiểm tra số lượng từ của comment(trống hoặc trên 500 từ)
	if(!req.query.comment || req.query.comment.trim().length == 0 || req.query.comment.length > 500){
		return resp.json({
			code: 1004,
			message: "Parameter value is invalid"
		});
	}

	if(req.query.id.length != 24){ // độ dài id phải là 24
		return resp.json({code:1004, message: "Parameter value is invalid"});
	}
	try{
		let tmp = await Promise.all([
			Post.findOne({_id: req.query.id}),	// lấy ra post
			FriendBlock.find({accountDoBlock_id: req.account._id}) // lấy danh sách ng bị mk chặn
		]);

		// kiểm tra bài viết bị khóa
		if(tmp[0].banned){
			if(tmp[0].banned == "1"){
				return resp.json({
					code: 1011,
					message: "Could not public this post"
				});
			}
			if(tmp[0].banned == "2"){
				return resp.json({
					code: 1012,
					message: "Limited access"
				});
			}
		}

		let tmp2 = await Promise.all([
				FriendBlock.find({ /* tìm xem mình có bị chủ bài viết chặn ko */
					accountDoBlock_id: tmp[0].account_id, 
					blockedUser_id: req.account._id}),
				Comment.find({ post_id: req.query.id}) /* lấy comment*/
					.skip( parseInt(req.index) )
					.limit( parseInt(req.count) )
			]);
		// kiểm tra mk bị chủ bài viết chặn
		if(tmp2[0].length != 0){
			return resp.json({
				code: 1009,
				message: "Not access"
			});
		}

		// lọc danh sách bình luận chặn nhau
		let cmtRes = tmp2[1].filter(comment => !tmp[1].includes(comment.userComment_id));// lấy ra comment có userComment_id không có trong ds chặn của mk

		// lấy ra thông tin người comment
		let cmterIds = cmtRes.map(cmt => cmt.userComment_id);
		let cmters = await Account.find({ _id: {$in: cmterIds} });
		
		// lưu comment
		let myCmt = await new Comment({
			post_id: req.query.id,
			userComment_id: req.account._id,
			content: req.query.comment})
			.save();
		cmters.push(req.account);
		cmtRes.push(myCmt);

		resp.json({
			code: 1000,
			message: "OK",
			data: commentMapper(cmtRes, cmters)
		});
	} catch (err){
		console.log(err);
		resp.json({
			code: 1005,
			message: "Unknown error"
		});
	}
});

function commentMapper(cmts, cmters){
	return cmts.map(cmt => {
		let cmter = cmters.find(cmter => cmter._id.equals(cmt.userComment_id));
		return {
			id: cmt._id,
			comment: cmt.content,
			created: cmt.createdTime.getTime(),
			poster: {
				id: cmter._id,
				name: cmter.name,
				avatar: cmter.avatar.url
			}
		}
	});
}

module.exports = router;