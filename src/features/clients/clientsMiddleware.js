const { ReasonPhrases, StatusCodes } = require("http-status-codes");
const { addBinnacle } = require("../binnacle/binnacleMiddleware");
const { binnacleModel } = require("../binnacle/binnacleSchema");
const { clientExternalModel } = require("../clientExternal/clientExternalSchema");
const { clientInternalModel } = require("../clientInternal/clientInternalSchema");
const { employeeModel } = require("../employee/employeeSchema");


const getClientsById = async(req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    let data = await clientInternalModel.findOne({_id:req._id});
    if(!data)
        data = await clientExternalModel.findOne({_id:req._id});
    if(data!==null){
        res.status(StatusCodes.OK).send(JSON.stringify(data));
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
    }else{
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
    }
}

const getEmployeeInstitutionById = async(req,res,next) => {
    req.binnacleId = await addBinnacle(req);

    let data = await clientInternalModel.findOne({_id:req._id});
    if(!data)
        data = await employeeModel.findOne({_id:req._id});
    if(data!==null){
        res.status(StatusCodes.OK).send(JSON.stringify(data));
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
    }else{
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});

    }
}

module.exports = {getClientsById, getEmployeeInstitutionById}