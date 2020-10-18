const express = require('express');
const app = express();
const PORT = process.env.PORT || 8888;

//load biến môi trường từ file .env
require('dotenv').config();

// connect db
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/fake-facebook', {useNewUrlParser: true, useUnifiedTopology: true});

// middlewares
const authMdw = require('./middlewares/auth.middleware');

// controllers
const accountController = require('./controllers/account.controller');
const postController = require('./controllers/post.controller');
const friendController = require('./controllers/friend.controller');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', accountController);
app.use('/', authMdw.authToken, postController);
app.use('/', authMdw.authToken, friendController);

app.get('/', (req, resp) => {
	resp.send("Hello World");
});

app.listen(PORT, () => console.log(`Server is started on port ${PORT}`));
