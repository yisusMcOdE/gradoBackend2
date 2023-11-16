const { StatusCodes, ReasonPhrases } = require('http-status-codes');
const { default: mongoose } = require('mongoose');
const { addBinnacle } = require('../binnacle/binnacleMiddleware');
const { binnacleModel } = require('../binnacle/binnacleSchema');
const { materialModel } = require('../material/materialSchema');
const { jobModel } = require ('./jobSchema');

const getAllJob = async (req,res,next) => {

    req.binnacleId = await addBinnacle(req);

    const data = await jobModel.find({},);
    if(data.length!==0){
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(data));
    }else{
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send();
    }
}

const getAllJobActive = async (req,res,next) => {

    req.binnacleId = await addBinnacle(req);

    const data = await jobModel.find({status:true});
    if(data!==null){
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(data));
    }else{
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send();
    }
}

const getJobById = async (req,res,next) => {

    req.binnacleId = await addBinnacle(req);

    const data = await jobModel.findOne({_id:req._id});
    if(data!==null){
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(data));
    }else{
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

const addJob = async (req, res) => {

    req.binnacleId = await addBinnacle(req);

    try {

        const materials = []
        for (let index = 0; index < req.body.materials.length; index++) {
            const item = req.body.materials[index];
            const {_id} = await materialModel.findOne({name:item.name},'_id');
            materials.push({...item, idMaterial:new mongoose.Types.ObjectId(_id)})
        }
        req.body.materials=materials;

        await jobModel.create(req.body);
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CREATED});
        res.status(StatusCodes.CREATED).send();
    } catch (error) {

        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_IMPLEMENTED}); 
    
        if(error.code===11000){
            res.status(
                StatusCodes.NOT_IMPLEMENTED).send({
                    message: ReasonPhrases.NOT_IMPLEMENTED, 
                    reason:`${Object.values(error.keyValue)[0]} ya existe`})
            return
        }
        
        if(error.errors?.materials?.message ||error.errors?.cost?.message){
            res.status(
                StatusCodes.NOT_IMPLEMENTED).send({
                    message: ReasonPhrases.NOT_IMPLEMENTED, 
                    reason:`${error.errors?.materials?.message || error.errors?.cost?.message}`})
            return
        }
        else
            res.status(StatusCodes.NOT_IMPLEMENTED).send({message: ReasonPhrases.NOT_IMPLEMENTED});

    }
}

const updateJob = async (req, res) => {

    req.binnacleId = await addBinnacle(req);
    let updates = {};

    try {
        if(req.body.cost){
            req.cost = [...req.body.cost];
            delete req.body.cost;
            updates.cost=[];
            for (let index = 0; index < req.cost.length; index++) {
                const element = req.cost[index];
                const updateQuery = {}
                updates.cost.push({});

                for (const key in element) {
                    if(key!=='_id')
                    updateQuery["cost.$."+key] = element[key]
                }

                await jobModel.findOneAndUpdate(
                    {_id:req._id, "cost._id": new mongoose.Types.ObjectId(element._id)},
                    updateQuery
                    ,
                    {runValidators: true}
                )
                updates.cost.push(updateQuery);
            }
        }
        if(req.body.materials){
            req.materials = [...req.body.materials];
            delete req.body.materials;
            updates.materials=[];
            for (let index = 0; index < req.materials.length; index++) {
                const element = req.materials[index];
                const updateQuery = {}
                updates.materials.push({});

                for (const key in element) {
                    if(key!=='_id'){
                        updateQuery["materials.$."+key] = element[key];
                        if(key==='name'){
                            const {_id} = await materialModel.findOne({name:element[key]},'_id');
                            updateQuery["materials.$.idMaterial"] = _id;
                        }
                    }
                }

                await jobModel.findOneAndUpdate(
                    {_id:req._id, "materials._id": new mongoose.Types.ObjectId(element._id)},
                    updateQuery
                    ,
                    {runValidators: true}
                )
                updates.materials.push(updateQuery);
            }
        }

        const response = await jobModel.findOneAndUpdate({_id:req._id}, req.body,{runValidators: true});
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
        console.log(error);
        if(error.code===11000){
            if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CONFLICT});
            res.status(StatusCodes.CONFLICT).send();
        }else{
            if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_MODIFIED});
            res.status(StatusCodes.NOT_MODIFIED).send({message: ReasonPhrases.NOT_MODIFIED});
        }
    }
}



module.exports = {getAllJob, getJobById, addJob, updateJob, getAllJobActive}