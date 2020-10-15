const multer = require('multer');

mudole.exports = (req, resp, next) => {
	const upload = multer().fields([
		{name: 'images', maxCount: 4},
		{name: 'video', maxCount: 1}
	]);

	upload(req, resp, (error) => {
		if(error){
			//console.log(error);
			if(error.code === 'LIMIT_UNEXPECTED_FILE'){
				return resp.json({
					code: 1008,
					message: "Maximum number of images"
				});
			}
			resp.json("error");
		}else{
			next();
		}
	})
}