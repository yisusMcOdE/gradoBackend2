const { StatusCodes, ReasonPhrases } = require('http-status-codes');
const { addBinnacle } = require('../binnacle/binnacleMiddleware');
const { binnacleModel } = require('../binnacle/binnacleSchema');
const { userModel } = require('../users/usersSchema');
const { clientInternalModel } = require ('./clientInternalSchema');

const getAllClient = async(req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    let data = await clientInternalModel.find({});
    if(data.length !== 0){
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(data));
    }else{
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

const getAllInternalsActive = async(req,res,next) => {
    req.binnacleId = await addBinnacle(req);

    let data = await clientInternalModel.find({status:true},'_id institution ');
    if(data.length !== 0){
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(data));
    }else{
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

const getClientById = async (req, res) => {

    req.binnacleId = await addBinnacle(req);

    const data = await clientInternalModel.findOne({_id:req._id});

    if(data!==null){
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(data));
    }else{
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
    
}

const addClient = async (req, res) => {

    req.binnacleId = await addBinnacle(req);
    let userResponse;
    try {
        /// Se crea Usuario
        userResponse = await userModel.create({
            user:req.body.user,
            password:req.body.password,
            role:'Cliente'
        })

        /// Se crea la institucion
        await clientInternalModel.create({
            idUser: userResponse._id,
            institution: req.body.institution,
            email: req.body.email,
            courier: req.body.courier,
            phone: req.body.phone,
            address: req.body.address
        })

        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CREATED});
        res.status(StatusCodes.CREATED).send({message:ReasonPhrases.CREATED});
    } catch (error) {
        console.log(error);
        if(userResponse)
            await userModel.deleteOne({_id:userResponse._id})

        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_IMPLEMENTED});
        if(error.code===11000)
            res.status(StatusCodes.NOT_IMPLEMENTED).send({message: ReasonPhrases.NOT_IMPLEMENTED, reason:`${error.keyValue.email || error.keyValue.institution || error.keyValue.user || error.keyValue.phone} ya existe`});
        else
            res.status(StatusCodes.NOT_IMPLEMENTED).send({message: ReasonPhrases.NOT_IMPLEMENTED});
    }
}

const updateClient = async (req, res) => {
        
    req.binnacleId = await addBinnacle(req);

    try {
            let response = await clientInternalModel.findOneAndUpdate({_id:req._id}, req.body, {runValidators: true});
            if(response !== null){
                const updates = {};
                for (const key in req.body) {
                    updates[key] = response[key]
                }

                await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.ACCEPTED, oldValues: JSON.stringify(updates)});
                res.status(StatusCodes.ACCEPTED).send();

            }else{
                await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_FOUND});
                res.status(StatusCodes.NOT_FOUND).send();
            }
    } catch (error) {
        if(error.code===11000){
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CONFLICT});
            res.status(StatusCodes.CONFLICT).send();
        }else{
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_MODIFIED});
            res.status(StatusCodes.NOT_MODIFIED).send();}
    }
}


module.exports = {getAllClient, getClientById, addClient, updateClient, getAllInternalsActive}