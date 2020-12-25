const mongoose = require('mongoose');
const { Schema } = mongoose;
const Account = require('./account.model');

const reportSchema = new mongoose.Schema({
	reporterId: {type: Schema.Types.ObjectId, ref: Account},
  	postId: String,
  	subject: String,
  	details: String,
});

var Report = mongoose.model('Report', reportSchema);

module.exports = Report;