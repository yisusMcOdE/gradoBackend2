const { StatusCodes, ReasonPhrases } = require('http-status-codes');
const { mongoose } = require ('../../database/connection.js');
const { addBinnacle } = require('../binnacle/binnacleMiddleware.js');
const { binnacleModel } = require('../binnacle/binnacleSchema.js');
const { clientInternalModel } = require('../clientInternal/clientInternalSchema.js');
const { jobModel } = require('../job/jobSchema.js');
const { materialModel } = require('../material/materialSchema.js');
const { orderDetailsModel } = require('../orderDetails/orderDetailsSchema.js');
const { nextStep } = require('../step/stepMiddleware.js');
const { orderInternalModel } = require('./orderInternalSchema.js');
const jwt = require('jsonwebtoken');


const getOrderInternalList = async(req,res,next) => {

    req.binnacleId = await addBinnacle(req);

    const response = await orderInternalModel.find({});
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

const getAllOrderInternal = async(req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    const response = await orderInternalModel.aggregate([
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

const getOrderInternalById = async (req,res,next) => {

    req.binnacleId = await addBinnacle(req);

    const response = await orderInternalModel.aggregate([
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
              confirmed: { $first: '$confirmed' }
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

const addOrderInternal = async (req,res,next) => {

    req.binnacleId = await addBinnacle(req);
    let responseOrder
    const alertMaterial = {};

    try { 
        ///Verificando si es cliente
        const token = req.headers.authorization.slice(7);
        const decodedToken = jwt.decode(token);
        user = decodedToken.data.user;
        if(decodedToken.data.role === 'Cliente'){
            let client = await clientInternalModel.aggregate([
                {
                    $lookup:{
                        from: 'users',
                        localField: 'idUser',
                        foreignField:'_id',
                        as: 'user'
                    }
                },
                {
                    $unwind: '$user'
                },
                {
                    $match:{'user.user':user}
                },
                {
                    $group:{
                        _id: '$_id',
                        institution: {$first:'$institution'}
                    }
                }
            ])
            if(client.length!==0){
                req.body.client = client[0].institution
            }
        }
    
        ///Validaciones basicas
        if(!['Institucionales', 'Propios'].includes(req.body.fundsOrigin))
            throw new Error('Origen de fondos no valido');
        if(req.body.details?.length===0){
            throw new Error('No existe trabajos en el pedido');
        }

        /// Obteniendo id de cliente por nombre de institucion

        if(req.body.idUser){
            const {institution} = await clientInternalModel.findOne({idUser:req.body.idUser})
            req.body.client = institution;
        }

        const idClient = await clientInternalModel.findOne({institution:req.body.client},'_id');

        if(idClient===null)
            throw new Error('Id de cliente no encontrado');
        req.body.idClient = idClient._id;
        

        /// Creacion de la order
        responseOrder = await orderInternalModel.create(req.body);
        const idOrder = responseOrder._id;

        /// Preparando datos de cada detalle
        const promisesDetail = await req.body.details.map(async(item)=> {
            const idJob = await jobModel.findOne({name:item.job},'_id');

            if(idJob===null)
                throw new Error('Id del trabajo no encontrado');

            const final = {
                ...item, 
                idOrder:new mongoose.Types.ObjectId(idOrder),
                idJob:idJob._id
            }
            return final
        });
        const resolverDetails = await Promise.all(promisesDetail);

        /// Creando todos los detalles
        const responseDetails = await orderDetailsModel.create(resolverDetails);


        /// Alterando los Materiales y dando next step por cada orden creada;
        for (let index = 0; index < responseDetails.length; index++) {
            const item = responseDetails[index];

            const requiredQuantity = item.requiredQuantity;

            const job = await jobModel.findOne({_id:item.idJob});

            for (let index = 0; index < job.materials.length; index++) {
                const itemMaterial = job.materials[index];
                const idMaterial = itemMaterial.idMaterial;

        
                const reserved = Number((requiredQuantity * itemMaterial.required) / itemMaterial.produced).toFixed(2);
                const available = Number(((requiredQuantity * itemMaterial.required) / itemMaterial.produced)).toFixed(2);
        
                const material = await materialModel.findOne({_id : new mongoose.Types.ObjectId(idMaterial)});

        
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
                    }
                )
                
            }

            await nextStep(item._id);
        }

        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CREATED});
        res.status(StatusCodes.CREATED).send({message:ReasonPhrases.CREATED, alert:alertMaterial});

    } catch (error) {
        console.log(error);
        if(responseOrder){
            await orderInternalModel.deleteOne({_id : responseOrder._id});
            await orderDetailsModel.deleteMany({idOrder : responseOrder._id});
        }
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_IMPLEMENTED});
        res.status(StatusCodes.NOT_IMPLEMENTED).send({message: ReasonPhrases.NOT_IMPLEMENTED});
    }
}

module.exports = {getAllOrderInternal, getOrderInternalList, addOrderInternal, getOrderInternalById}