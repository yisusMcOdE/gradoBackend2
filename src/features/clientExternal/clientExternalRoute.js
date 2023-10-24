const { mongoose } = require ('../../database/connection.js');
const express = require ('express');
const { getAllClientExternal, getClientExternalById, addClientExternal, updateClientExternal, removeClientExternal, getAllClientExternalActive } = require('./clientExternalMiddleware.js');


const clientExternalRoute = express.Router();

clientExternalRoute.param('id', (req,res,next,value) => {
    req._id = new mongoose.Types.ObjectId(value);
    next();
})


clientExternalRoute.get('', getAllClientExternal);

clientExternalRoute.get('/active', getAllClientExternalActive);

clientExternalRoute.get('/:id', getClientExternalById);

clientExternalRoute.post('', addClientExternal);

clientExternalRoute.put('/:id',updateClientExternal);


module.exports = {clientExternalRoute}