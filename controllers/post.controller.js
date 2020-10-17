const router = require('express').Router();
const Post = require('../models/post.model');
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

module.exports = router;