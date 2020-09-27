const router = require('express').Router();
const Account = require('../models/account.model');

router.post('/signup', async (req, resp) => {
	// lấy phoneNumber truyền từ client
	let phoneNumber = req.body.phonenumber;

	// tìm tài khoản ứng với số điện thoại vừa lấy đk
	let account = await Account.find({phoneNumber: phoneNumber});
	
	if(account.length == 0){ // tài khoản chửa tồn tại
		// thêm tài khoản vào database
		await new Account({phoneNumber: phoneNumber,
			password: req.body.password
		}).save();

		// sinh mã xác thực

		// gửi dữ liệu về cho client
		resp.json({
			code: 1000,
			message: "OK"
		});
	}
	else{ // tài khoản đã tồn tại
		resp.json({
			code: 9996,
			message: "User existed"
		});
	}
});

module.exports = router;