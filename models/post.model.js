const mongoose = require('mongoose');
const { Schema } = mongoose;
const Account = require('./account.model');

// tạo khung cho account
const postSchema = new mongoose.Schema({
	account_id: {type: Schema.Types.ObjectId, ref: Account},
	described: String,
	images: [{url: String, publicId: String}],
	video: {url: String, publicId: String},
	userLike_id: {type: [Schema.Types.ObjectId], ref: Account},
  	createdTime:{ type: Date, default: Date.now },
  	modified: Date,
  	status: String,
  	canComment: Boolean
});
postSchema.index({ described: "text"});

// tạo model
var Post = mongoose.model('Post', postSchema);

module.exports = Post;
