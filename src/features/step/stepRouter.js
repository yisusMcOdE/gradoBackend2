const express = require('express');
const { mongoose } = require ('../../database/connection');
const { getStepsByJobsId, addStepByJobsId, addDelay } = require('./stepMiddleware');

const stepRoute = express.Router();

stepRoute.param('id',(req,res,next,value)=>{
    req._id = new mongoose.Types.ObjectId(value);
    next();
})

stepRoute.get('/:id', getStepsByJobsId);
stepRoute.put('/next/:id', addStepByJobsId);
stepRoute.post('/delay', addDelay);

module.exports = {stepRoute};