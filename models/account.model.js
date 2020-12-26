const mongoose = require('mongoose');

// tạo khung cho account
const accountSchema = new mongoose.Schema({
	name: String,
	password: String,
	phoneNumber: String,
	avatar: {url: String, publicId: String},
	coverImage: {url: String, publicId: String},
	online: Boolean,
	token: String,
	isBlocked: Boolean,
	uuid: String,
	active: Boolean,
	createdTime:{ type: Date, default: Date.now },
	description: String,
	link: String,
	city: String,
	country: String,
	coordinates: {latitude: String, longitude: String}
});

// tạo model
var Account = mongoose.model('Account', accountSchema);

Account.prototype.getDefaultAvatar = () => {
	return 'https://res.cloudinary.com/it4895/image/upload/v1607791757/it4895/avatars/default-avatar_jklwc7.jpg';
}

Account.prototype.getAvatar = () => {
	if(!this.avatar) return 'https://res.cloudinary.com/it4895/image/upload/v1607791757/it4895/avatars/default-avatar_jklwc7.jpg';
	return this.avatar.url;
}

module.exports = Account;
