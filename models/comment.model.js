const mongoose = require('mongoose');
const { Schema } = mongoose;

// tạo khung cho account
const commentSchema = new mongoose.Schema({
	userComment_id: Schema.Types.ObjectId,
	content: String,
  createdTime:{ type: Date, default: Date.now },
});

// tạo model
var Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
