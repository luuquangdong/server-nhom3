const mongoose = require('mongoose');
const { Schema } = mongoose;

// tạo khung cho account
const postSchema = new mongoose.Schema({
	account_id: String,
	content: String,
	media: String,
	userLike_id: [Schema.Types.ObjectId],
	comment_id: [Schema.Types.ObjectId],
  createdTime:{ type: Date, default: Date.now },
});
postSchema.index({ content: "text"});

// tạo model
var Post = mongoose.model('Post', postSchema);

module.exports = Post;
