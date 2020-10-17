const jwt = require('jsonwebtoken');
const Account = require('../models/account.model');

module.exports.authToken = async (req, resp, next) => {
	try{
		let payload = jwt.verify(req.body.token, process.env.TOKEN_SECRET);
		let account = await Account.findOne({phoneNumber: payload.phoneNumber});
		if(account == null){
			resp.json({
				code: 1005,
				message: "Unknown error"
			});
			return;
		}
		req.payload = payload;
		req.account = account;
		next();
	}catch(err){
		console.log(err);
		resp.json({
			code: 9998,
			message: "Token is invalid"
		});
	}
}
