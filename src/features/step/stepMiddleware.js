const { StatusCodes, ReasonPhrases } = require("http-status-codes");
const { default: mongoose } = require("mongoose");
const { addBinnacle } = require("../binnacle/binnacleMiddleware");
const { binnacleModel } = require("../binnacle/binnacleSchema");
const { orderDetailsModel } = require("../orderDetails/orderDetailsSchema");
const { stepModel } = require("./stepSchema");

const descriptions = {
    registered:'El trabajo a sido registrado en el sistema.',
    confirmation:'El trabajo fue confirmado para su realizacion.',
    scheduled:'El trabajo a sido agendado para su elaboracion.',
    develop:'El trabajo esta siendo procesado.',
    resumed:'El trabajo fue reanudado y esta siendo procesado.',
    finished:'El trabajo ya fue finalizado.',
}


const getStepsByJobsId = async (req,res,next) => {

    req.binnacleId = await addBinnacle(req);

    const response = await stepModel.find({idOrderDetail:req._id});
    if(response!==null){
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(response));
    }else{
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

const addStepByJobsId = async (req, res ,next) => {
    req.binnacleId = await addBinnacle(req);

    try {
        await nextStep(req._id);
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CREATED});
        res.status(StatusCodes.OK).send({message: ReasonPhrases.OK});
    } catch (error) {
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_IMPLEMENTED});
        res.status(StatusCodes.NOT_IMPLEMENTED).send({message: ReasonPhrases.NOT_IMPLEMENTED});
    }
}

const nextStep = async (id) => {
    return new Promise (async(resolve)=>{
        const step = {
            idOrderDetail: new mongoose.Types.ObjectId(id),
            startedAt: new Date()
        }
    
        ///Obteniendo utlimo step del detalle
        const stepsDetail = await stepModel.find({idOrderDetail:id});
            
        //Si es primera vez
        if(stepsDetail.length===0){
            step.type = "registered";
            step.description = descriptions.registered;
            step.finishedAt = new Date();
            await stepModel.create(step);

            step.type = "confirmation";
            step.description = descriptions.confirmation;
            step.finishedAt = "";
            step.startedAt = new Date();
            await stepModel.create(step);
            resolve('resolved');
        } else if (stepsDetail.length===2){
            ///Si tiene registered y confirmation
            const {_id} = stepsDetail.find(item => item.type === 'confirmation');
            await stepModel.updateOne({_id:_id},{finishedAt: new Date()});

            step.type = "scheduled";
            step.description = descriptions.scheduled;
            await stepModel.create(step);
            resolve('resolved');
        } else if (stepsDetail.length===3){
            const {_id} = stepsDetail.find(item => item.type === 'scheduled');
            await stepModel.updateOne({_id:_id},{finishedAt: new Date()});
    
            step.type = "develop";
            step.description = descriptions.develop;
            await stepModel.create(step);
            resolve('resolved');
        } else {
            const lastIndex = stepsDetail.findIndex(item => item.finishedAt===undefined)
            if (stepsDetail[lastIndex].type==='delayed'){
                await stepModel.updateOne({_id:stepsDetail[lastIndex]._id},{finishedAt: new Date()});
                
                step.type = "resumed";
                step.description = descriptions.resumed;
                await stepModel.create(step);
                resolve('resolved');
            } else if (stepsDetail[lastIndex].type==='develop'||stepsDetail[lastIndex].type==='resumed'){
                await stepModel.updateOne({_id:stepsDetail[lastIndex]._id},{finishedAt: new Date()});
                step.type = "finished";
                step.description = descriptions.finished;
                step.finishedAt = new Date();
                await stepModel.create(step);
                resolve('resolved');
            }else{
                resolve('resolved');
            }
        }
    })
}

const addDelay = async(req,res,next)=> {

    req.binnacleId = await addBinnacle(req);

    ///Modelo inicial de step
    const id = new mongoose.Types.ObjectId(req.body.id);

    const step = {
        idOrderDetail: id,
        startedAt: new Date(),
        description: req.body.description,
        dayDelay: req.body.days
    }

    ///Obteniendo utlimo step del detalle
    const stepsDetail = await stepModel.find({idOrderDetail:id}).sort({createdAt:-1}).limit(1);


    if (['scheduled','develop','resumed','delayed'].includes(stepsDetail[0]?.type)){
        await stepModel.updateOne({_id:stepsDetail[0]._id},{finishedAt: new Date()});
        step.type = "delayed";
        await stepModel.create(step);
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CREATED});
        res.status(StatusCodes.CREATED).send({message: ReasonPhrases.CREATED});
    }else{
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_IMPLEMENTED});
        res.status(StatusCodes.NOT_IMPLEMENTED).send({message: ReasonPhrases.NOT_IMPLEMENTED});
    }
    
}

module.exports = {getStepsByJobsId, nextStep, addDelay, addStepByJobsId};