const { StatusCodes, ReasonPhrases } = require("http-status-codes");
const { addBinnacle } = require("../binnacle/binnacleMiddleware");
const { binnacleModel } = require("../binnacle/binnacleSchema");
const { equipmentModel } = require("./equipmentSchema");

const getAllEquipment = async(req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    const data = await equipmentModel.find({});
    if(data!==null){
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(data));
    }else{
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

const getEquipmentById = async(req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    const response = await binnacleModel.findOne({_id : req._id});
    if(response!==null){
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(response));
    }else{
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

const addEquipment = async(req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    const newEquipment = new equipmentModel(req.body);
    try {
        await newEquipment.save();
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CREATED});
        res.status(StatusCodes.CREATED).send({message:ReasonPhrases.CREATED});
    } catch (error) {
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_IMPLEMENTED});
        res.status(StatusCodes.NOT_IMPLEMENTED).send({message: ReasonPhrases.NOT_IMPLEMENTED});
    }
}

const updateEquipment = async(req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    try {
        const response = await equipmentModel.findOneAndUpdate({_id:req._id}, req.body);
        if(response!==null){
            const updates = {};
            for (const key in req.body) {
                updates[key] = response[key]
            }
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.ACCEPTED, oldValues: JSON.stringify(updates)});
            res.status(StatusCodes.ACCEPTED).send({message:ReasonPhrases.ACCEPTED});
        }
        else{
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_FOUND});
            res.status(StatusCodes.NOT_FOUND).send({message:ReasonPhrases.NOT_FOUND});
        }
    } catch (error) {
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_MODIFIED});
        res.status(StatusCodes.NOT_MODIFIED).send({message: ReasonPhrases.NOT_MODIFIED});
    }
}

module.exports = {getAllEquipment, addEquipment, getEquipmentById, updateEquipment}