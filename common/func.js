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

function isPhoneNumber(number){
	const regPhone = /^0\d{9}$/;
	return regPhone.test(number);
}

module.exports = {
	isValidName,
	isPhoneNumber
}