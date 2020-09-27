const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
	name: String,
	password: String,
	phoneNumber: String,
	linkAvatar: String
});

var Account = mongoose.model('Account', accountSchema);

module.exports = Account;