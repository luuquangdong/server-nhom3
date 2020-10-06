const jwt = require('jsonwebtoken');
const Account = require('../models/account.model');

module.exports.authToken = async (req, resp, next) => {
	try{
		let tokenData = jwt.verify(req.body.token,"it4895");
		let account = Account.findOne({phoneNumber: tokenData.phoneNumber});
		if(account == null){
			resp.json({
				code: 1005,
				message: "Unknown error"
			});
			return;
		}
		req.tokenData = token;
		req.account = account;
		next();
	}catch(err){
		resp.json({
			code: 9998,
			message: "token is invalid"
		});
	}
}