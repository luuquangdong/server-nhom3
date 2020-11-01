const router = require('express').Router();
const Post = require('../models/post.model');
const Comment = require('../models/comment.model');
const Account = require('../models/account.model');
const FriendBlock = require('../models/friendblock.model');

const cloudinary = require('./cloudinaryConfig');
const uploadFile = require('../middlewares/uploadFile.middleware');
const authMdw = require('../middlewares/auth.middleware');

router.post('/add_post',uploadFile, authMdw.authToken , async (req, resp) => {
	if(req.files.image && req.files.video){
		// có cả ảnh và video => từ chối
		return resp.json({
			code: 1007,
			message: 'Upload file failed.'
		});
	}

	if(req.body.described.length > 500) { // vượt quá 500 từ
		return resp.json({
			code: 1004,
			message: 'Parameter value is invalid.'
		});
	}

	let post = new Post();

	if(req.files.image){ // upload ảnh
		try {
			let uploadPromises = req.files.image.map(cloudinary.uploads);
			let data = await Promise.all(uploadPromises);
			// xử lý data
			post.images = data;

		} catch (error) {
			// lỗi ko xđ
			console.log(error);
			return resp.json({
				code: 1007,
				message: "Upload file failed."
			});
		}
	}
	
	if(req.files.video){ // upload video
		try {
			let data = await cloudinary.uploads(req.files.video[0]);
			// xử lý data
			post.video = data;

		} catch (error) {
			// lỗi ko xđ
			return resp.json({
				code: 1007,
				message: "Upload file failed."
			});
		}
	}
	// lưu thông tin post vào csdl
	post.account_id = req.account._id;
	post.described = req.body.described;
	post.status = req.body.status;
	post = await post.save();

	resp.json({
		code: 1000,
		message: "OK",
		data: {
			id: post._id
		}
	});
});

router.post('/get_post', authMdw.authToken, async (req, resp) => {
	let id = req.body.id;
	if(id.length != 24){
		return resp.json({code:1004, message: "Parameter value is invalid"});
	}
	let post = await Post.findOne({_id: id});
	if(post == null){// sai id bài post
		return resp.json({code:9992, message: "Post is not existed"});
	}
	// console.log(post);
	let proCount = Comment.countDocuments({post_id: id}).exec();
	let proAuthor = Account.findOne({_id: post.account_id}).exec();
	try{
		let tmp = await Promise.all([proCount, proAuthor]);
		// console.log(tmp);
		let result = {
			id: post._id,
			described: post.described,
			created: post.createdTime.getTime(),
			modified: post.modified,
			like: post.userLike_id.length,
			comment: tmp[0],
			author: {
				id: tmp[1]._id,
				name: tmp[1].name,
				avatar: tmp[1].avatar.url,
				online: tmp[1].online
			},
			is_liked: post.userLike_id.includes(req.account._id) ? 1 : 0,
			status: post.status,
			can_edit: req.account._id.equals(tmp[1]._id) ? true : false,
			banned: post.banned, // cái này là như nào nhỉ
			can_comment: post.canComment
		};
		if(post.images.length !== 0){
			result.image = post.images.map((image)=> {
				let {url, publicId} = image;
				return {id: publicId, url: url};
			});
		}
	//	console.log(req.account._id.equals(tmp[1]._id));
	//	console.log(req.account._id, tmp[1]._id);
		if(post.video.url != undefined){
			result.video = {
				url: post.video.url,
				thumb: post.getVideoThumb()
			}
		}
		let isBlocked = await FriendBlock.findOne({
			accountDoBlock_id: tmp[1]._id, 
			blockedUser_id: req.account._id
		});
		result.is_blocked = isBlocked == null ? 0 : 1;

		resp.json({
			code: 200,
			message: "OK",
			data: result
		});
	}catch(err){
		console.log(err);
		resp.json({
				code: 1005,
				message: "Unknown error"
		});
	}
});

module.exports = router;