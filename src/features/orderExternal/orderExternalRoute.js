const { mongoose } = require ('../../database/connection.js');
const express = require ('express');
const { getAllOrderExternal, addOrderExternal, getOrderExternalList, getOrderExternalById } = require('./orderExternalMiddleware.js');

const orderExternalRoute = express.Router();

orderExternalRoute.param('id', (req,res,next,value) => {
    req._id = new mongoose.Types.ObjectId(value);
    next();
})

orderExternalRoute.get('', getAllOrderExternal);
orderExternalRoute.get('/detail/:id', getOrderExternalById);
orderExternalRoute.get('/list', getOrderExternalList);

orderExternalRoute.post('', addOrderExternal);

module.exports = {orderExternalRoute}