const { StatusCodes, ReasonPhrases } = require('http-status-codes');
const { mongoose } = require ('../../database/connection.js');
const { addBinnacle } = require('../binnacle/binnacleMiddleware.js');
const { binnacleModel } = require('../binnacle/binnacleSchema.js');
const { clientExternalModel } = require('../clientExternal/clientExternalSchema.js');
const { jobModel } = require('../job/jobSchema.js');
const { materialModel } = require('../material/materialSchema.js');
const { orderDetailsModel } = require('../orderDetails/orderDetailsSchema.js');
const { nextStep } = require('../step/stepMiddleware.js');
const { orderExternalModel, getNextSequenceValue } = require('./orderExternalSchema.js');


const getAllOrderExternal = async(req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    const response = await orderExternalModel.aggregate([
        {
            $lookup:{
                from :'orderdetails', 
                localField:'_id', 
                foreignField:'idOrder',
                as:'details'
            }
        },
        {
            $unwind: '$details'
        },
        {
            $lookup: {
                from: 'jobs',
                localField: 'details.idJob',
                foreignField: '_id',
                as: 'details.job'
            }
        },
        {
            $unwind: '$details.job'
        },
        {
            $group: {
              _id: '$_id',
              status: { $first: '$status' },
              idClient: { $first: '$idClient'},
              date:{ $first: '$date'},
              cost:{ $first: '$cost'},
              statusDelivered:{ $first: '$statusDelivered'},
              details: { $push: '$details' }
            }
          }
    ]);
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
const getOrderExternalList = async(req,res,next) => {

    req.binnacleId = await addBinnacle(req);

    const response = await orderExternalModel.find({});
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

const addOrderExternal = async (req,res,next) => {

    req.binnacleId = await addBinnacle(req);

    const alertMaterial = {};

    try{

        ///Validaciones basicas
        if(req.body.details?.length===0){
            throw new Error('No existe trabajos en el pedido');
        }

        ///Agregando id de cliente por ci
        const idClient = await clientExternalModel.findOne({ci:req.body.ci},'_id');
        req.body.idClient = idClient._id;
        if(idClient===null)
            throw new Error('Id de cliente no encontrado');
        
        ///Agregando numero de TicketPay
        req.body.numberTicketPay = await getNextSequenceValue();

        ///Creando orden 
        const responseOrder = await orderExternalModel.create(req.body);
        const idOrder = responseOrder._id;


        ///Preparando trabajos para cada orden
        let details = req.body.details;
            ///Agregando id de orden y id de trabajo a cada pedido
        const promises = await details.map(async(item)=> {
            const idJob = await jobModel.findOne({name:item.job},'_id');

            if(idJob===null)
                throw new Error('Id de trabajo no encontrado');

            const final = {
                ...item, 
                idOrder:new mongoose.Types.ObjectId(idOrder),
                idJob:idJob._id
            }
            return final
        });
        const resolverDetails = await Promise.all(promises);

        ///Creando los trabajos de la orden
        const responseDetails = await orderDetailsModel.create(resolverDetails);

        ///Actualizando los valores de materiales utilizados
        for (let index = 0; index < responseDetails.length; index++) {
            const item = responseDetails[index];

            const requiredQuantity = item.requiredQuantity;

            const job = await jobModel.findOne({_id:item.idJob});

            for (let index = 0; index < job.materials.length; index++) {
                const itemMaterial = job.materials[index];
                const idMaterial = itemMaterial.idMaterial;
        
                const reserved = Number((requiredQuantity * itemMaterial.required) / itemMaterial.produced).toFixed(2);
                const available = Number(((requiredQuantity * itemMaterial.required) / itemMaterial.produced)).toFixed(2);
        
                const material = await materialModel.findOne({_id : idMaterial});
        
                const newReserved = Number(material.reserved + Number(reserved)).toFixed(2);
                const newAvailable = Number(material.available - Number(available)).toFixed(2);
        
                if(newAvailable<0){
                    alertMaterial[item.job] = alertMaterial[item.job] ? `${alertMaterial[item.job]}, ${itemMaterial.name}` : itemMaterial.name
                }

                await materialModel.findOneAndUpdate(
                    {
                        _id: idMaterial
                    },
                    {
                        reserved: newReserved,
                        available: newAvailable
                    },
                    {
                        new:true
                    }
                )
            }
            await nextStep(item._id);
        }
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CREATED});
        res.status(StatusCodes.CREATED).send({message:ReasonPhrases.CREATED, alert:alertMaterial, data:responseOrder});

    } catch (error){
        console.log(error)
        if(responseOrder){
            await orderExternalModel.deleteOne({_id : responseOrder._id});
            await orderDetailsModel.deleteMany({idOrder : responseOrder._id});
        }
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_IMPLEMENTED});
        res.status(StatusCodes.NOT_IMPLEMENTED).send({message: ReasonPhrases.NOT_IMPLEMENTED});
    }
}

const getOrderExternalById = async (req,res,next) => {

    req.binnacleId = await addBinnacle(req);

    const response = await orderExternalModel.aggregate([
        {
            $match : {_id:req._id}
        },
        {
            $lookup:{
                from :'orderdetails', 
                localField:'_id', 
                foreignField:'idOrder',
                as:'details'
            }
        },
        {
            $unwind: '$details'
        },
        {
            $lookup: {
                from: 'steps',
                localField: 'details._id',
                foreignField: 'idOrderDetail',
                as: 'details.steps'
            }
        },
        {
            $unwind: '$details'
        },
        {
            $group: {
              _id: '$_id',
              status: { $first: '$status' },
              idClient: { $first: '$idClient'},
              date:{ $first: '$date'},
              cost:{ $first: '$cost'},
              statusDelivered:{ $first: '$statusDelivered'},
              details: { $push: '$details' },
              client: { $first: '$client' },
              payStatus: { $first: '$payStatus' }
            }
        }
    ])
    
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

module.exports = {getAllOrderExternal, getOrderExternalList, addOrderExternal, getOrderExternalById}