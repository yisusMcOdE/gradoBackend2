const express = require('express');
const { getCharges, updateCharges } = require('./chargesMiddleware');

const chargesRoute = express.Router();

chargesRoute.get('',getCharges);
chargesRoute.put('', updateCharges);

module.exports={chargesRoute}

