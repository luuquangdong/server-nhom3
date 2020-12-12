const mongoose = require('mongoose');

// tạo khung cho account
const accountSchema = new mongoose.Schema({
	name: String,
	password: String,
	phoneNumber: String,
	avatar: {url: String, publicId: String},
	online: Boolean,
	token: String,
	isBlocked: Boolean,
	uuid: String,
	active: Boolean,
	createdTime:{ type: Date, default: Date.now }
});

// tạo model
var Account = mongoose.model('Account', accountSchema);

module.exports = Account;
