const express = require ('express');
const { getAllOrdersNoConfirm, confirmOrder, getOrderFinishedById, finishOrderById, cancelOrder, getAllOrdersFinished, finishTotalOrderById, getAllOdersList, getOrderById, getAllOdersListById } = require('./ordersMiddleware');
const { mongoose } = require ('../../database/connection.js');



const ordersRoute = express.Router();

ordersRoute.param('id', (req, res, next, value) => {
    req._id = new mongoose.Types.ObjectId(value);
    next();
})

ordersRoute.get('/internalExternal/:id', getOrderById);
ordersRoute.get('/allList', getAllOdersList);
ordersRoute.get('/allListById', getAllOdersListById);
ordersRoute.get('/finish/:id', getOrderFinishedById);
ordersRoute.get('/noConfirm', getAllOrdersNoConfirm);
ordersRoute.get('/allFinished/', getAllOrdersFinished);

ordersRoute.put('/finish/:id', finishOrderById);
ordersRoute.put('/confirm/:id', confirmOrder);
ordersRoute.put('/cancel/:id', cancelOrder);
ordersRoute.put('/finishTotal/:id', finishTotalOrderById);

module.exports = {ordersRoute}