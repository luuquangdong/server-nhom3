const router = require('express').Router();
const Post = require('../models/post.model');
const Comment = require('../models/comment.model');
const Account = require('../models/account.model');
const FriendBlock = require('../models/friendblock.model');

const cloudinary = require('./cloudinaryConfig');
const uploadFile = require('../middlewares/uploadFile.middleware');
const authMdw = require('../middlewares/auth.middleware');

const {resCode, response} = require('../common/response_code');

router.post('/add_post',uploadFile, authMdw.authToken , async (req, resp) => {

	const {described, status} = req.query;

	if(!described || !status) return response(resp, 1002);

	if(req.files.image && req.files.video){
		// có cả ảnh và video => từ chối
		return resp.json({
			code: "1007",
			message: 'Upload file failed.'
		});
	}

	if(req.query.described.length > 500) { // vượt quá 500 từ
		return resp.json({
			code: '1004',
			message: 'Parameter value is invalid.'
		});
	}

	if(!req.query.described && !req.files.image && !req.files.video){
		// không có nội dung, ảnh và video
		return resp.json({
			code: '1002',
			message: "Parameter is not enough"
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
				code: '1007',
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
				code: '1007',
				message: "Upload file failed."
			});
		}
	}
	// lưu thông tin post vào csdl
	post.account_id = req.account._id;
	post.described = req.query.described;
	post.status = req.query.status;
	post = await post.save();

	resp.json({
		code:'1000',
		message: "OK",
		data: {
			id: post._id
		}
	});
});

router.post('/like', authMdw.authToken, async (req, resp) => {

	const {id} = req.query;
	if(!id) return response(resp, 1002);

	if(req.query.id.length != 24){
		return resp.json({code:'1004', message: "Parameter value is invalid"});
	}

	let post = await Post.findOne({_id: req.query.id});
	if(post == null){ // post không tồn tại
		return resp.json({
			code: '9992',
			message: "Post is not existed"
		});
	}
	if(post.userLike_id.includes(req.account._id)){ 
		// người dùng đã thích rồi => xóa lượt thích
		post.userLike_id = post.userLike_id.filter( uli => !uli.equals(req.account._id) );
	} else {
		// người dùng chưa thích => tăng lượt thích
		post.userLike_id.push(req.account._id);
	}
	await post.save();
	resp.json({
		code: '1000',
		message: "OK",
		data: { like: post.userLike_id.length }
	});
});

router.post('/get_post', authMdw.authToken, async (req, resp) => {
	const id = req.query.id;

	if(!id) return response(resp, 1002);

	if(id.length != 24){
		return resp.json({code:'1004', message: "Parameter value is invalid"});
	}
	let post = await Post.findOne({_id: id});
	if(post == null){// sai id bài post
		return resp.json({code:'9992', message: "Post is not existed"});
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
			can_edit: req.account._id.equals(tmp[1]._id) ? 1 : 0,
			banned: post.banned, // cái này là như nào nhỉ
			can_comment: post.canComment
		};
		if(post.images.length !== 0){
			result.image = post.images.map((image)=> {
				let {url, _id} = image;
				return {id: _id, url: url};
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
			code: '1000',
			message: "OK",
			data: result
		});
	}catch(err){
		console.log(err);
		resp.json({
				code: '1005',
				message: "Unknown error"
		});
	}
});

module.exports = router;