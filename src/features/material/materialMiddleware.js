const { StatusCodes, ReasonPhrases } = require("http-status-codes");
const { addBinnacle } = require("../binnacle/binnacleMiddleware");
const { binnacleModel } = require("../binnacle/binnacleSchema");
const { orderDetailsModel } = require("../orderDetails/orderDetailsSchema");
const { orderExternalModel } = require("../orderExternal/orderExternalSchema");
const { orderInternalModel } = require("../orderInternal.js/orderInternalSchema");
const { orderMaterialDetailModel } = require("../orderMaterial/orderMaterialDetailSchema");
const { stepModel } = require("../step/stepSchema");
const { materialModel } = require("./materialSchema");
const { mongoose } = require ('../../database/connection');


const getAllMaterial = async(req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    const data = await materialModel.find({});
    if(data!==null){
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(data));
    }else{
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

const getMaterialById = async (req,res,next) => {

    req.binnacleId = await addBinnacle(req);
    
    const data = await materialModel.findById({"_id":req.id});
    if(data!==null){
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(data));
    }else{
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

const addMaterial = async (req,res,next) => {

    req.binnacleId = await addBinnacle(req);

    try {
        await materialModel.create(req.body);

        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CREATED});
        res.status(StatusCodes.CREATED).send();
    } catch (error) {
        console.log(error)
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_IMPLEMENTED}); 
        if(error.code===11000)
            res.status(StatusCodes.NOT_IMPLEMENTED).send({message: ReasonPhrases.NOT_IMPLEMENTED, reason:`${error.keyValue.name} ya existe`});
        else
            res.status(StatusCodes.NOT_IMPLEMENTED).send({message: ReasonPhrases.NOT_IMPLEMENTED});
    
    }
}

const updateMaterial = async (req, res) => {

    req.binnacleId = await addBinnacle(req);

    try{
        

        const response = await materialModel.findOneAndUpdate({_id:req.id}, req.body,{runValidators: true});
        if(response!==null){
            const updates = {};
            for (const key in req.body) {
                updates[key] = response[key]
            }
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.ACCEPTED, oldValues: JSON.stringify(updates)});
            res.status(StatusCodes.ACCEPTED).send();
        }
        else{
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_FOUND});
            res.status(StatusCodes.NOT_FOUND).send();
        }
    }catch (error){
        console.log(error);
        if(error.code===11000){
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CONFLICT});
            res.status(StatusCodes.CONFLICT).send();
        }else{
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_MODIFIED});
            res.status(StatusCodes.NOT_MODIFIED).send();}
    }
}

const updateOver = async(req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    try {
        const updates = [];
        for (let index = 0; index < req.body.length; index++) {
            const item = req.body[index];
            const response = await materialModel.findOneAndUpdate(
                {
                    _id : new mongoose.Types.ObjectId(item.id)
                },
                {
                    $inc : { over : item.cantidad}
                });

            updates.push({
                material: response.name,
                over: response.over,
                id: response._id
            })
        }
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.ACCEPTED, oldValues: JSON.stringify(updates)});
        res.status(StatusCodes.ACCEPTED).send({message:ReasonPhrases.ACCEPTED});
    } catch (error){
        res.status(StatusCodes.NOT_MODIFIED).send({message: ReasonPhrases.NOT_MODIFIED});
    }
}

const getMaterialExtract = async(req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    let stract = [];

    const compras = await orderMaterialDetailModel.find({'idMaterial':req.id, 'deliveredQuantity':{ $gt: 0}});

    compras.map(item => {
        const elementStract = {
            detail : 'Compra',
            detailQuantity : item.requiredQuantity,
            client : 'Imprenta Universitaria',
            quantity : `+ ${item.deliveredQuantity}`,
            date : item.updatedAt.toISOString().slice(0,10)
        }
        stract.push(elementStract);
    })

    let usos = await orderDetailsModel.aggregate([
        {
            $match : {deliveredQuantity : { $gt : 0 }}
        },
        {
            $lookup:{
                from: 'jobs',
                localField: 'idJob',
                foreignField: '_id',
                as: 'jobDetails'
            }
        },
        {
            $unwind: '$jobDetails'
        },
        {
            $match: {
                'jobDetails.materials':{
                    $elemMatch:{
                        idMaterial : req.id
                    }
                }
            }
        }
    ]);

    let item = {};
    for (let index = 0; index < usos.length; index++) {
        item = usos[index];
        const cantidad = item.deliveredQuantity;

        let itemMaterial = {}
        for (let index = 0; index < item.jobDetails.materials.length; index++) {
            itemMaterial = item.jobDetails.materials[index];

            if(itemMaterial.idMaterial.toString() === req.id.toString()){

                let order = await orderExternalModel.findOne({ _id : item.idOrder });
                if(order === null){
                    order = await orderInternalModel.findOne({ _id : item.idOrder });
                }

                let dateFinish = await stepModel.findOne({ idOrderDetail : item._id, type : 'finished'});

                    stract.push({
                        detail : item.job,
                        detailQuantity : cantidad,
                        client : order.client,
                        quantity : `- ${Number((cantidad * itemMaterial.required) / itemMaterial.produced).toFixed(2)}`,
                        date : dateFinish.startedAt.toISOString().slice(0,10)
                    })
            }
        }
    }
    stract.sort((a,b)=> (new Date(a.date)) - (new Date(b.date)));

    if(req.query.start!==undefined && req.query.end!==undefined)
    {
        console.log(req.query.start);
            console.log(req.query.end);
        stract = stract.filter(item => {
            const filterStart = new Date(req.query.start);
            const filterEnd = new Date(req.query.end);
            const itemDate = new Date(item.date);

            console.log(filterStart);
            console.log(filterEnd);
            console.log(itemDate);

            return ((itemDate >= filterStart)&&(itemDate <= filterEnd))
        })
    }

    if(stract!==[]){
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(stract));
    }else{
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

module.exports = {getAllMaterial, getMaterialById, addMaterial, updateMaterial, updateOver, getMaterialExtract};