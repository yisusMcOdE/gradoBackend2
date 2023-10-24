const { mongoose } = require ('../../database/connection.js');
const express = require ('express');
const { getAllOrderMaterials, addOrderMaterials, confirmOrderMaterial, getOrderMaterialById, cancelOrderMaterial } = require ('./orderMaterialMiddleware.js');

const orderMaterialsRoute = express.Router();

orderMaterialsRoute.param('id', (req,res,next,value) => {
    req._id = new mongoose.Types.ObjectId(value);
    next();
})

orderMaterialsRoute.get('', getAllOrderMaterials);
orderMaterialsRoute.get('/:id', getOrderMaterialById);

orderMaterialsRoute.post('', addOrderMaterials);

orderMaterialsRoute.put('/confirm/:id', confirmOrderMaterial);
orderMaterialsRoute.put('/cancel/:id', cancelOrderMaterial);



module.exports = {orderMaterialsRoute}