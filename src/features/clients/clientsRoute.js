const express = require ('express');
const { mongoose } = require ('../../database/connection.js');
const { getClientsById, getEmployeeInstitutionById } = require('./clientsMiddleware.js');


const clientsRoute = express.Router();

clientsRoute.param('id', (req, res, next, value) => {
    req._id = new mongoose.Types.ObjectId(value);
    next();
})

clientsRoute.get('/empInst/:id', getEmployeeInstitutionById);
clientsRoute.get('/:id', getClientsById);

module.exports = {clientsRoute}