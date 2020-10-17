const mongoose = require('mongoose');

// tạo khung cho account
const accountSchema = new mongoose.Schema({
	name: String,
	password: String,
	phoneNumber: String,
	avatar: {url: String, publicId: String},
	online: Boolean,
});

// tạo model
var Account = mongoose.model('Account', accountSchema);

module.exports = Account;
