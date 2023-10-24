const { mongoose } = require ('../../database/connection.js');
const express = require ('express');
const { getAllEquipment, addEquipment, getEquipmentById, updateEquipment } = require('./equipmentMiddleware');


const equipmentRoute = express.Router();

equipmentRoute.param('id', (req,res,next,value) => {
    req._id = new mongoose.Types.ObjectId(value);
    next();
})

equipmentRoute.get('', getAllEquipment);
equipmentRoute.get('/detail/:id', getEquipmentById);
equipmentRoute.post('', addEquipment);
equipmentRoute.put('/:id', updateEquipment);

module.exports = {equipmentRoute}