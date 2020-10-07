const router = require('express').Router();
const Post = require('../models/post.model');
const Comment = require('../models/comment.model');

router.post('/search', async (req, resp) => {
	let token = req.body.token;
	let keyword = req.body.keyword;
  let user_id = req.body.user_id;
  let index = req.body.index;
  let count = req.body.count;

	let posts = await Post.find(
		 { $text: { $search: keyword } },
		 { score: { $meta: "textScore" } }
	).sort( { score: { $meta: "textScore" } } ).exec();
	//console.log(posts);

	resp.json({
		code: 1000,
		message: 'OK',
		data: {
			id: '',
			image: '',
			video: {
				thumb: '',
				url: '',
			},
			like: '',
			comment: '',
			is_liked: '',
			author: {
				id: '',
				username: '',
				avatar: '',
			},
			described: '',
		}
	});

});

module.exports = router;
