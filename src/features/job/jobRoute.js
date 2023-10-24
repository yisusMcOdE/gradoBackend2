const express = require ('express');
const { mongoose } = require ('../../database/connection');
const { getAllJob, getJobById, addJob, removeJob, updateJob, getAllJobActive} = require('./jobMiddleware');


const jobRoute = express.Router();

jobRoute.param('id',(req,res,next,value)=>{
    req._id = new mongoose.Types.ObjectId(value);
    next();
})

///-----------------ROUTES-----------------///

jobRoute.get('', getAllJob);

jobRoute.get('/active', getAllJobActive);

jobRoute.get('/:id', getJobById);

jobRoute.post('', addJob);

jobRoute.put('/:id',updateJob);


module.exports = {jobRoute};