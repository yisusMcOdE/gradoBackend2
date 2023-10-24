const express = require ('express');
const { getAreaReport, getOrdersTotalFinished } = require('./reportsMiddleware');

const reportRoute = express.Router();

reportRoute.param('area', (req, res, next, value) => {
    req.area = value;
    next();
})

reportRoute.get('/area/:area', getAreaReport);
reportRoute.get('/orders/total', getOrdersTotalFinished);

module.exports={reportRoute}