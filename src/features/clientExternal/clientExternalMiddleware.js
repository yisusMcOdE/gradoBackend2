const { StatusCodes, ReasonPhrases } = require('http-status-codes');
const { addBinnacle } = require('../binnacle/binnacleMiddleware');
const { binnacleModel } = require('../binnacle/binnacleSchema');
const { clientExternalModel } = require('./clientExternalSchema');

const getAllClientExternal = async(req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    let data = await clientExternalModel.find({});
    if(data.length!==0){
        res.status(StatusCodes.OK).send(JSON.stringify(data));
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});

    }else{
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message:ReasonPhrases.NO_CONTENT});
    }
}

const getAllClientExternalActive = async(req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    let data = await clientExternalModel.find({status:true},'_ic name ci');
    if(data!==null){
        res.status(StatusCodes.OK).send(JSON.stringify(data));
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});

    }else{
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message:ReasonPhrases.NO_CONTENT});
    }
}

const getClientExternalById = async (req, res) => {

    req.binnacleId = await addBinnacle(req);

    const data = await clientExternalModel.findOne({_id:req._id});
    if(data!==null){
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(data));
    }else{
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send(JSON.stringify({message:ReasonPhrases.NO_CONTENT}));
    }
    
}

const addClientExternal = async (req, res) => {

    req.binnacleId = await addBinnacle(req);

    try {
        
        await clientExternalModel.create({
            title: req.body.title,
            ci: req.body.ci,
            name: req.body.name,
            phone: req.body.phone,
            email: req.body.email,
        });

        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CREATED});
        res.status(StatusCodes.CREATED).send();
    } catch (error) {
        console.log(error)
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_IMPLEMENTED}); 
        if(error.code===11000)
            res.status(StatusCodes.NOT_IMPLEMENTED).send({message: ReasonPhrases.NOT_IMPLEMENTED, reason:`${error.keyValue.ci || error.keyValue.phone || error.keyValue.email} ya existe`});
        else
            res.status(StatusCodes.NOT_IMPLEMENTED).send({message: ReasonPhrases.NOT_IMPLEMENTED});
    
    }
}

const updateClientExternal = async (req, res) => {

    req.binnacleId = await addBinnacle(req);

    try {
        const response = await clientExternalModel.findOneAndUpdate({_id:req._id}, req.body);

        if(response!==null){
            const updates = {};
            for (const key in req.body) {
                updates[key] = response[key]
            }
            if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.ACCEPTED, oldValues: JSON.stringify(updates)});

            res.status(StatusCodes.ACCEPTED).send({message:ReasonPhrases.ACCEPTED});
        }
        else{
            if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_FOUND});
            res.status(StatusCodes.NOT_FOUND).send({message:ReasonPhrases.NOT_FOUND});
        }
    } catch (error) {
        if(error.code===11000){
            if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CONFLICT});
            res.status(StatusCodes.CONFLICT).send();
        }else{
            if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_MODIFIED});
            res.status(StatusCodes.NOT_MODIFIED).send({message:ReasonPhrases.NOT_MODIFIED});}
    }
    
}


module.exports = {getAllClientExternal, getClientExternalById, addClientExternal, updateClientExternal, getAllClientExternalActive}