const { mongoose } = require ('../../database/connection.js');
const express = require ('express');
const { getAllOrderInternal, addOrderInternal, getOrderInternalList, getOrderInternalById } = require('./orderInternalMiddleware.js');

const orderInternalRoute = express.Router();

orderInternalRoute.param('id', (req,res,next,value) => {
    req._id = new mongoose.Types.ObjectId(value);
    next();
})

orderInternalRoute.get('', getAllOrderInternal),
orderInternalRoute.get('/detail/:id', getOrderInternalById),
orderInternalRoute.get('/list', getOrderInternalList);

orderInternalRoute.post('', addOrderInternal);

module.exports = {orderInternalRoute}