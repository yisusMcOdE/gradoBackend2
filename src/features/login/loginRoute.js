const { mongoose } = require('../../database/connection.js');
const express = require('express');
const { getCredentialsEmployee } = require('../employee/employeeMiddleware.js');

const loginRoute = express.Router();

loginRoute.post('/employee', getCredentialsEmployee);

module.exports = {loginRoute}