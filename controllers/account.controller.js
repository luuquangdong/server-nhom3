const router = require('express').Router();
const jwt = require('jsonwebtoken');

// import model
const Account = require('../models/account.model');
const VerifyCode = require('../models/verifycode.model');

// import middleware
const uploadAvatar = require('../middlewares/uploadAvatar.middleware');
const authMdw = require('../middlewares/auth.middleware');

const cloudinary = require('./cloudinaryConfig');

router.post('/login', async (req, resp) => {
	let phoneNumber = req.query.phonenumber;
	let password = req.query.password;
	let account = await Account.findOne({phoneNumber: phoneNumber, password: password});
	// khong co nguoi dung nay
	if (account == null){
		return resp.json({
			code: 9995,
			message: 'User is not validated'
		});
	}
	//Dung password va phonenumber
	let token = jwt.sign({
		userId: account._id,
		phoneNumber: phoneNumber,
		uuid: req.query.uuid
	}, process.env.TOKEN_SECRET);
//		const res = await Account.updateOne({ phoneNumber: phoneNumber }, { token: token } );
	// account.online = true;
	account.token = token;
	account.save();
	resp.json({
		code: 1000,
		message: 'OK',
		data: {
			id: account._id,
			username: account.username,
			token: token,
			avatar: account.avatar.url,
		}
	});
});

router.post('/signup', async (req, resp) => {
	// lấy phoneNumber truyền từ client
	let phoneNumber = req.query.phonenumber;
	// tìm tài khoản ứng với số điện thoại vừa lấy đk
//	console.log(req.query);
	let account = await Account.find({phoneNumber: phoneNumber});

	if(account.length == 0){ // tài khoản chửa tồn tại
		// thêm tài khoản vào database
		await new Account({phoneNumber: phoneNumber,
			password: req.query.password
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

router.post('/logout', async (req, resp)=>{
	try{
		let payload = jwt.verify(req.query.token, process.env.TOKEN_SECRET);
		let account = await Account.findOne({_id: payload.userId});
		if(account === null){
			return resp.json({
				code: 9998,
				message: "token is invalid"
			});
		}
//		account.online = false;
		account.token = undefined;
		account.save();
		resp.json({
			code: 1000,
			message: "OK"
		});
	}catch(err){
		resp.json({
			code: 9998,
			message: "token is invalid"
		});
	}
});

router.post('/get_verify_code', async (req, resp) => {
	let account = await Account.findOne({phoneNumber: req.query.phonenumber});
	if(account == null){ // người dùng chưa đăng ký
		resp.json({
			code: 9995,
			message: "User is not validated"
		});
		return;
	}

	let verify = await VerifyCode.findOne({phoneNumber: req.query.phonenumber});
	if(verify == null){ // người dùng đã active
		resp.json({
			code: 1010,
			message: "Action has been done previously by this user"
		});
		return;
	}

	if(verify.limitedTime){
		// xử lý limited time
		let milsec = verify.lastUpdate.getTime();
		if(Date.now() - milsec < 120000){
			resp.json({
				code: 1009,
				message: "Not access"
			});
			return;
		}
	}
	verify.code.push(generateVerifyCode());
	verify.lastUpdate = Date.now();
	verify.limitedTime = true;
	await verify.save();
	resp.json({
		code: 1000,
		message: "OK"
	});
});

router.post('/check_verify_code', async (req, resp) => {
	let account = await Account.findOne({phoneNumber: req.query.phonenumber});
	if(account == null){
		resp.json({
			code: 9995,
			message: 'User is not existed'
		});
		return;
	}
	let verifyCode = await VerifyCode.findOne({phoneNumber: req.query.phonenumber});
//	console.log(verifyCode);
	if(verifyCode == null){ // người dùng đã active
			resp.json({
				code: 1010,
				message: "Action has been done previously by this user"
			});
			return;
	}
	let dung = verifyCode.code.find(item => item === req.query.code_verify);
	if(dung){ // đúng code_verify
		resp.json({
			code: 1000,
			message: "OK"
		});
		verifyCode.deleteOne();
	}else{ // sai code_verify
		resp.json({
			code: 9993,
			message: "Code verify is incorrect"
		});
	}
});

router.post('/change_info_after_signup', uploadAvatar, authMdw.authToken, async (req, resp) => {
	let account = req.account;

	if( !req.query.username ) { // tên trống
		return resp.json({
			code: 1002,
			message: "Parameter is not enough"
		});
	}
	console.log(req.query.username);
	// console.log(isValidName(req.query.username));
	if( !isValidName(req.query.username) ){ // tên không hợp lệ
		return resp.json({
			code: 1004,
			message: "Parameter value is invalid."
		});
	}

	// nếu có avatar mới gửi lên => xóa avatar cũ nếu có
	if( req.file && account.avatar ){
		cloudinary.remove(account.avatar.publicId);
	}

	// upload avatar mới
	if(req.file){
		try{
			let data = await cloudinary.uploads(req.file);
			account.avatar = data;
		} catch (err) {
			console.log(err);
			return resp.json({
					code: 1007,
					message: "Upload file failed."
				});
		}
	}
	// lưu lại thông tin
	account.name = req.query.username;
	account.save();
   
	resp.json({
		id: account._id,
		username: account.name,
		phonenumber: account.phoneNumber,
		created: new Date().getTime(),
		avatar: account.avatar.url
	});
});

router.post('/change_password', authMdw.authToken, async (req, resp) => {
	let password = req.query.password;
	let newPassword = req.query.new_password;
	// kiểm tra mật khẩu
	if(req.account.password !== password){
		return resp.json({
			code: 1004,
			message: 'Parameter value is invalid'
		});
	}

	if(!checkPassword(newPassword)){
		//mật khẩu mới không hợp lệ
	 	return resp.json({
			code: 1004,
			message: 'Parameter value is invalid'
		});
	}

	// kiểm tra giống nhau
	let n = lcs(password, newPassword);
	if(n/password.length >= 0.8 || n/newPassword.length >= 0.8){
		return resp.json({
			code: 1004,
			message: 'Parameter value is invalid'
		});
	}
	req.account.password = newPassword;
	await req.account.save();
	resp.json({
		code: 1000,
		message: 'OK'
	});
});

function checkPassword(password){
	// được phép là chữ, số, dấu cách, gạch dưới, độ dài từ 6 -> 30 kí tự
	const regChar = /^[\w_ ]{6,30}$/;
	// số điện thoại
	const regPhone = /^0\d{9}$/;
	if( !regChar.test(password)){
		return false;
	}
	if(regPhone.test(password)){
		return false;
	}
	return true;
}

function lcs(s1, s2){
	let result = [];
	let firstRaw = [];
	for(let i=0; i<=s1.length; i++) firstRaw.push(0);
	result.push(firstRaw);
	
	for(let i=0; i<s2.length;i++){
		let tmp=[];
		tmp.push(0);
		for(let j=0; j<s1.length; j++){
			tmp.push(s1[i]===s2[j]? 1 + result[i][j] : 0);
		}
		result.push(tmp);
	}
	let maxLength = result[0][0];
	for(let i=1; i<=s2.length; i++){
		for(let j=1; j<=s1.length; j++)
			if(result[i][j]>maxLength) maxLength = result[i][j];
	}
	return maxLength;
}

function isValidName(username){
	// ĐK1: cho phép chữ, số, dấu cách, gạch dưới, từ 2 -> 36 ký tự
	const regName = /^[\p{L} _\d]{2,36}$/u;
	// số điện thoại
	const regPhone = /^0\d{9}$/;

	if( !regName.test(username) ){ // ko thỏa mãn ĐK1
		console.log("dk1");
		return false;
	}
	if( regPhone.test(username) ){ // là số điện thoại
		console.log("dk2");
		return false;
	}
	return true;
}

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
