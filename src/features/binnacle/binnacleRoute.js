const express = require ('express');
const { getEquipmentById } = require('../equipment/equipmentMiddleware');
const { getAllBinnacle } = require('./binnacleMiddleware');
const { mongoose } = require ('../../database/connection.js');


const binnacleRoute = express.Router();

binnacleRoute.param('id', (req,res,next,value) => {
    req._id = new mongoose.Types.ObjectId(value);
    next();
})

binnacleRoute.get('', getAllBinnacle);
binnacleRoute.get('/:id', getEquipmentById);

module.exports = {binnacleRoute}