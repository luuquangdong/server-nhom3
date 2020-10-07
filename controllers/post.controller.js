const router = require('express').Router();

router.post('/test', (req, resp) =>{
	resp.json("OK");
})

module.exports = router;