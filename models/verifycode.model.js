const mongoose = require('mongoose');

// tạo khung cho account
const verifyCodeSchema = new mongoose.Schema({
	phoneNumber: String,
	code: [String]
});

// tạo model 
var VerifyCode = mongoose.model('VerifyCode', verifyCodeSchema);

module.exports = VerifyCode;