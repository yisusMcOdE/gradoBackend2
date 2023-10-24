const { mongoose } = require ('../../database/connection.js');
const express = require ('express');
const { getAllClient, getClientById, addClient, removeClient, updateClient, getAllInternalsActive} = require('./clientInternalMiddleware');


const clientInternalRoute = express.Router();

clientInternalRoute.param('id', (req,res,next,value) => {
    req._id = new mongoose.Types.ObjectId(value);
    next();
})

clientInternalRoute.get('', getAllClient);

clientInternalRoute.get('/active', getAllInternalsActive);

clientInternalRoute.get('/:id', getClientById);

clientInternalRoute.post('', addClient);

clientInternalRoute.put('/:id',updateClient);

module.exports = {clientInternalRoute}