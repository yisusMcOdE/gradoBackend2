const { mongoose } = require ('../../database/connection.js');
const express = require ('express');
const { getAllOrderDetailsConfirmed, getOrdersDelayed } = require('./orderDetailsMiddelware.js');

const orderDetailsRoute = express.Router();

orderDetailsRoute.param('id', (req,res,next,value) => {
    req._id = new mongoose.Types.ObjectId(value);
    next();
})

orderDetailsRoute.get('',getAllOrderDetailsConfirmed);
orderDetailsRoute.get('/delayed', getOrdersDelayed);

module.exports = {orderDetailsRoute}