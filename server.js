const express = require('express');
const app = express();
const PORT = process.env.PORT || 8888;

// connect db
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/fake-facebook', {useNewUrlParser: true, useUnifiedTopology: true});

// middlewares
const authMdw = require('./middlewares/auth.middleware');

// controllers
const accountController = require('./controllers/account.controller');
const postController = require('./controllers/post.controller');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', accountController);
app.use('/', authMdw.authToken, postController);

app.get('/', (req, resp) => {
	resp.send("Hello World");
});

app.listen(PORT, () => console.log(`Server is started on port ${PORT}`));
