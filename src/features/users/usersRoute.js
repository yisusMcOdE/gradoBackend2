const express = require ('express');
const { mongoose } = require ('../../database/connection.js');
const { getAllUsers, getAllUsersComplete, getUserById, updateUser } = require('./usersMiddleware.js');


const usersRoute = express.Router();

usersRoute.param('id', (req, res, next, value) => {
    req._id = new mongoose.Types.ObjectId(value);
    next();
})

usersRoute.get('', getAllUsers);
usersRoute.get('/complete', getAllUsersComplete);
usersRoute.get('/:id', getUserById);
usersRoute.put('/:id', updateUser);

module.exports = {usersRoute}