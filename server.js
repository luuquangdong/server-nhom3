const express = require('express');
const app = express();
const PORT = process.env.PORT || 8888;

//load biến môi trường từ file .env
require('dotenv').config();

// connect db
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/fake-facebook', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useCreateIndex: true
});

// middlewares
const authMdw = require('./middlewares/auth.middleware');

// controllers
const accountController = require('./controllers/account.controller');
const postController = require('./controllers/post.controller');
const friendController = require('./controllers/friend.controller');
const searchController = require('./controllers/search.controller');
const pushController = require('./controllers/push.controller');
const commentController = require('./controllers/comment.controller');
const videoController = require('./controllers/video.controller');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', accountController);
app.use('/', postController);
app.use('/', authMdw.authToken, searchController);
app.use('/', authMdw.authToken, pushController);
app.use( authMdw.authToken );
app.use('/', friendController);
app.use('/', commentController);
app.use('/', searchController);
app.use('/',authMdw.authToken, videoController);

app.get('/', (req, resp) => {
	resp.send("Hello World");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
