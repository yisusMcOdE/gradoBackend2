const express = require('express');
const { sendStatus, updateConfigEmail } = require('./emailMiddlewate');

const emailRoute = express.Router();

emailRoute.get('/status',sendStatus);
emailRoute.put('', updateConfigEmail);

module.exports={emailRoute}

