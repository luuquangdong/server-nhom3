const mongoose = require('mongoose');

// tạo khung cho account
const verifyCodeSchema = new mongoose.Schema({
	phoneNumber: String,
	code: [String],
	lastUpdate: Date,
	limitedTime: Boolean
});

// tạo model 
var VerifyCode = mongoose.model('VerifyCode', verifyCodeSchema);

module.exports = VerifyCode;