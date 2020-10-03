const express = require('express');
const app = express();
const PORT = process.env.PORT || 8888;

// connect db
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/fake-facebook', {useNewUrlParser: true, useUnifiedTopology: true});

const accountController = require('./controllers/account.controller');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', accountController);

app.get('/', (req, resp) => {
	resp.send("Hello World");
});

app.listen(PORT, () => console.log(`Server is started on port ${PORT}`));
