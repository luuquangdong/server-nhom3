const mongoose = require('mongoose');
const { Schema } = mongoose;
const Account = require('./account.model');

// tạo khung cho account
const postSchema = new mongoose.Schema({
	account_id: {type: Schema.Types.ObjectId, ref: Account},
	content: String,
	linkImage: [String],
	linkVideo: String,
	userLike_id: {type: [Schema.Types.ObjectId], ref: Account},
  createdTime:{ type: Date, default: Date.now },
});
postSchema.index({ content: "text"});

// tạo model
var Post = mongoose.model('Post', postSchema);

module.exports = Post;
