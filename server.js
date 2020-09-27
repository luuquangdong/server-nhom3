const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.listen(process.env.PORT || 8888, () => console.log("Server is started..."));