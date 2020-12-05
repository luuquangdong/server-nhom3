const express = require('express');
const app = express();
const PORT = process.env.PORT || 8888;

//load biến môi trường từ file .env
require('dotenv').config();

// connect db
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URL, {
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/it4788', accountController);
app.use('/it4788', postController);

app.use('/it4788', authMdw.authToken);

app.use('/it4788', pushController);
app.use('/it4788', friendController);
app.use('/it4788', commentController);
app.use('/it4788', searchController);


app.get('/', (req, resp) => {
	resp.send("Hello World");
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
