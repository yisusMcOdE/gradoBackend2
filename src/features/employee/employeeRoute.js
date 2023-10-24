const express = require ('express');
const { mongoose } = require ('../../database/connection');
const { getAllEmployee, getEmployeeById, addEmployee, removeEmployee, updateEmployee} = require('./employeeMiddleware');


const employeeRoute = express.Router();

employeeRoute.param('id',(req,res,next,value)=>{
    req._id = new mongoose.Types.ObjectId(value);
    next();
})

///-----------------ROUTES-----------------///

employeeRoute.get('', getAllEmployee);

employeeRoute.get('/:id', getEmployeeById);

employeeRoute.post('', addEmployee);

employeeRoute.put('/:id',updateEmployee);


module.exports = {employeeRoute};