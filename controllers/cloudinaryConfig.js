const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
	cloud_name: process.env.CLOUD_NAME,
	api_key: process.env.API_KEY,
	api_secret: process.env.SECRET_KEY
});

let streamUpload = function(file) {
	return new Promise((resolve, reject) => {
		let folder = file.fieldname + 's';
		// định nghĩa hàm upload
		let stream = cloudinary.uploader.upload_stream(
			{
				folder: folder, 
				resource_type: "auto"
			},
			(err, result) => {
				if(result) {
					resolve({
						url: result.url,
						id: result.public_id
					});
				}else {
					reject(err);
				}
			}
		);
		// thực hiện upload
		streamifier.createReadStream(file.buffer).pipe(stream);
	});
}

module.exports.uploads = streamUpload;