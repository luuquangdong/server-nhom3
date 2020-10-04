const router = require('express').Router();

const jwt = require('jsonwebtoken');

const Account = require('../models/account.model');
const VerifyCode = require('../models/verifycode.model');

router.post('/login', async (req, resp) => {
	let phoneNumber = req.body.phonenumber;
	let password = req.body.password;
	let account = await Account.find({phoneNumber: phoneNumber, password: password});
	console.log(account);

	// khong co nguoi dung nay
	if (account.length == 0){
		resp.json({
			code: 9995,
			message: 'User is not validated'
		});
		return;
	} else {
		//Dung password va phonenumber
		let token = jwt.sign({
			phoneNumber: phoneNumber,
			deviceId: req.body.deviceId
		}, 'it4895');
		const res = await Account.updateOne({ phoneNumber: phoneNumber }, { token: token } );
		console.log(res);
		resp.json({
			code: 1000,
			message: 'OK',
			data: {
				id: account[0].id ,
				username: account[0].username,
				token: token,
				avatar: account[0].avatar,
			}
		});
	}
});

router.post('/signup', async (req, resp) => {
	// lấy phoneNumber truyền từ client
	let phoneNumber = req.body.phonenumber;

	// tìm tài khoản ứng với số điện thoại vừa lấy đk
	console.log(req.body);
	let account = await Account.find({phoneNumber: phoneNumber});

	if(account.length == 0){ // tài khoản chửa tồn tại
		// thêm tài khoản vào database
		await new Account({phoneNumber: phoneNumber,
			password: req.body.password
		}).save();

		// sinh mã xác thực
		let verifycode = generateVerifyCode();
		// lưu mã xác thực
		await new VerifyCode({
			phoneNumber: phoneNumber,
			code: [verifycode]
		}).save();

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

function generateVerifyCode(){
	let num = [];
	let char = [];
	// tạo số lượng số
	let amountNum = Math.ceil(Math.random()*5);
	// tạo số
	for(let i=0; i<amountNum; i++){
		num.push(Math.floor(Math.random()*10));
	}
	// tạo chữ
	for(let i=0; i<6-amountNum; i++){
		let charCode = Math.floor(Math.random()*26) + 97;
		char.push(String.fromCharCode(charCode));
	}
	// nhét số vào chữ
	for(let item of num){
		let index = Math.floor( Math.random() * (char.length+1) );
		char.splice(index, 0, item);
	}
	return char.join("");
}

module.exports = router;
