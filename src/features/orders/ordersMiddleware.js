const jwt = require('jsonwebtoken');
const { StatusCodes, ReasonPhrases } = require("http-status-codes");
const { sendEmail } = require("../../config/mailer");
const { addBinnacle } = require("../binnacle/binnacleMiddleware");
const { binnacleModel } = require("../binnacle/binnacleSchema");
const { clientExternalModel } = require("../clientExternal/clientExternalSchema");
const { clientInternalModel } = require("../clientInternal/clientInternalSchema");
const { jobModel } = require("../job/jobSchema");
const { materialModel } = require("../material/materialSchema");
const { orderDetailsModel } = require("../orderDetails/orderDetailsSchema");
const { orderExternalModel } = require("../orderExternal/orderExternalSchema");
const { orderInternalModel } = require("../orderInternal.js/orderInternalSchema");
const { nextStep } = require("../step/stepMiddleware");
const { sendMessage } = require("../whatsapp/whatsappRoute");

const getAllOdersList = async (req,res,next) => {
    req.binnacleId = await addBinnacle(req);
    const allData = {
        internal:[],
        external:[]
    }
    let responseInternal = await orderInternalModel.find({status:true},'_id client statusDelivered createdAt dateDelivered')
    let responseExternal = await orderExternalModel.find({status:true},'_id client statusDelivered createdAt dateDelivered')

    if(responseInternal.length!==0 || responseExternal.length!==0){

        allData.internal = responseInternal;
        allData.external = responseExternal

        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(allData));
    }else{
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

const getAllOdersListById = async (req,res,next) => {
    req.binnacleId = await addBinnacle(req);

    const token = req.headers.authorization.slice(7);
    const decodedToken = jwt.decode(token);
    const user = decodedToken.data.user;

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
            }
        }
    ])

    if(client.length!==0)
        client = client[0]
        let responseInternal = await orderInternalModel.aggregate([
        {
            $match:{
                'status':true,
                'idClient':client._id
            }
        },
        {
            $lookup:{
                from: 'orderdetails',
                localField: '_id',
                foreignField: 'idOrder',
                as: 'details'
            }
        },
        {
            $unwind: '$details'
        },
        {
            $group:{
                _id: '$_id',
                client: {$first: '$client'},
                statusDelivered: {$first: '$statusDelivered'},
                createdAt: {$first: '$createdAt'},
                dateDelivered: {$first: '$dateDelivered'},
                details: {$push: '$details'}
            }
        }
    ])
    if(responseInternal.length!==0){
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        responseInternal = responseInternal.map(item=>{
            item.details = item.details.reduce(
                (accum, current, currentIndex, details)=>{
                    if(currentIndex === details.length-1)
                        return accum + `${current.job} (${current.requiredQuantity}).`
                    else
                    return accum + `${current.job} (${current.requiredQuantity}), `
                },'')
            return item
        }) 
        res.status(StatusCodes.OK).send(JSON.stringify(responseInternal));
    }else{
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

const getOrderById = async (req,res,next) => {
    req.binnacleId = await addBinnacle(req);
    let internal = true;
    
    let response = await orderInternalModel.findOne({_id: req._id})
    if(response === null){
        response = await orderExternalModel.findOne({_id: req._id})
        if(response === null){
            if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_FOUND});
            res.status(StatusCodes.NOT_FOUND).send({});
        }else
        internal = false
    }

    const query = [
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
    ]

    let data;

    if(internal){
        data = await orderInternalModel.aggregate(query);
    }else{
        data = await orderExternalModel.aggregate(query);
    }

    if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
    res.status(StatusCodes.OK).send(JSON.stringify(data[0]));
    
}

const getAllOrdersNoConfirm = async (req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    let ordersExternal = await orderExternalModel.aggregate([
        {
            $match: {
                status : true
            }
        },
        {
            $lookup: {
                from: 'orderdetails',
                localField: '_id',
                foreignField: 'idOrder',
                as: 'details'
            }
        },
        {
            $unwind: '$details'
        },
        {
            $group:{
                _id: '$_id',
                client: { $first : '$client' },
                date: { $first : '$createdAt' },
                cost : { $first : '$cost' },
                numberTicketPay : {$first : '$numberTicketPay'},
                numberCheck : {$first : '$numberCheck'},
                details: { $push : '$details'},
            }
        }
    ]);
    ordersExternal = ordersExternal.filter(item=>{
        item.details = item.details.filter(itemDetail=>{
            return (!itemDetail.confirmed && itemDetail.status)
        })
        if(item.details.length===0)
            return false
        else
            return true
    })

    let ordersInternal = await orderInternalModel.aggregate([
        {
            $match: {
                status:true
            }
        },
        {
            $lookup: {
                from: 'orderdetails',
                localField: '_id',
                foreignField: 'idOrder',
                as: 'details'
            }
        },
        {
            $unwind: '$details'
        },
        {
            $group:{
                _id: '$_id',
                client: { $first: '$client' },
                date: { $first: '$createdAt' },
                cost : { $first: '$cost' },
                details: { $push: '$details'},
                fundsOrigin: { $first: '$fundsOrigin'}
            }
        }
    ]);
    ordersInternal = ordersInternal.filter(item=>{
        item.details = item.details.filter(itemDetail=>{
            return (!itemDetail.confirmed && itemDetail.status)
        })
        if(item.details.length===0)
            return false
        else
            return true
    })

    let allOrders = ordersExternal.concat(ordersInternal);
    allOrders = allOrders.map(item=>{
        let stringDetails = '';
        for (let index = 0; index < item.details.length; index++) {
            const element = item.details[index];
            stringDetails += `${element.job}(${element.requiredQuantity}), `
            if(index === item.details.length-1){
                stringDetails = stringDetails.slice(0,-2);
                stringDetails += '.'
            }
        }
        const date = item.date.toISOString()
        item.date=`${date.slice(0,10)} ${date.slice(11,19)}`
        item.stringDetails=stringDetails
        return item
    })
    if(allOrders.length!==0){
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(allOrders));
    }else{
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

const confirmOrder = async (req, res ,next) => {

    req.binnacleId = await addBinnacle(req);

    try {   

        let order
        const alertMaterial = {};

        /// Actualizamos number check y verificamos existencia de orden
        if(req.body.numberCheck!==undefined)
            order = await orderExternalModel.findOneAndUpdate({_id:req._id},{numberCheck:req.body.numberCheck});
        else
            order = await orderInternalModel.findOne({_id:req._id});

        if(order!== null){
            /// Obetenemos todos los trabajos de la orden
            let orderJobs = await orderDetailsModel.find({idOrder:order._id, confirmed:false});

            for(let itemOrderJobs of orderJobs) {

                ///Buscamos informacion del trabajo a realizar
                const job = await jobModel.findOne({_id : itemOrderJobs.idJob});

                const requiredQuantity = itemOrderJobs.requiredQuantity;

                const updatesMaterial = [];
                let conflict = false;
                
                ///Por cada material que utiliza el trabajo calculamos
                for(let itemMaterialJob of job.materials) {
                    ///Buscamos informacion del estado del material a utilizar
                    const material = await materialModel.findOne({_id:itemMaterialJob.idMaterial});

                    const reserved = Number(((requiredQuantity * itemMaterialJob.required) / itemMaterialJob.produced)).toFixed(2);
                    const used = Number(((requiredQuantity * itemMaterialJob.required) / itemMaterialJob.produced)).toFixed(2);

                    const newReserved = Number (material.reserved - Number(reserved)).toFixed(2);
                    const newUsed = Number (material.used + Number(used)).toFixed(2);

                    if(material.available <= 0){
                        alertMaterial[itemOrderJobs.job] = alertMaterial[itemOrderJobs.job] ? 
                                                                    `${alertMaterial[itemOrderJobs.job]}, ${itemMaterialJob.name}` : 
                                                                    itemMaterialJob.name;
                        conflict=true
                    }else{
                        updatesMaterial.push({
                            materialId:material._id,
                            newReserved,
                            newUsed
                        })
                    }
                }

                ///Si no existe un conflicto con los valores del material realizamos las actualizaciones necesarias
                if(!conflict){
                    for (let iterator of updatesMaterial) {
                        await materialModel.findOneAndUpdate(
                            {
                                _id: iterator.materialId
                            },
                            {
                                reserved: iterator.newReserved,
                                used: iterator.newUsed   
                            },
                            {
                                new:true
                            }
                        )
                    }
                    /// Cambiamos los días ya especificados de la orden para cada trabajo

                    const seconds = Number((req.body.details.find(item=>{ return item._id === itemOrderJobs._id.toString()}))?.seconds);
                    
                    await orderDetailsModel.findOneAndUpdate({_id:itemOrderJobs._id},{seconds:(seconds * 86400), confirmed:true})
                    ///Damos next step a cada orden
                    await nextStep(itemOrderJobs._id);
                }
            }

            if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.ACCEPTED});
                res.status(StatusCodes.ACCEPTED).send({message:ReasonPhrases.ACCEPTED, alert:alertMaterial});
        }else{
            if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_FOUND});
            res.status(StatusCodes.NOT_FOUND).send({message:ReasonPhrases.NOT_FOUND});
        }
    }catch (error) {
        console.log(error)
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_FOUND});
        res.status(StatusCodes.NOT_MODIFIED).send({message: ReasonPhrases.NOT_MODIFIED});
    }
}

const getOrderFinishedById = async(req, res, next) => {
    req.binnacleId = await addBinnacle(req);
    let data = await orderDetailsModel.aggregate([
        {
            $match:{_id:req._id}
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

    ]);
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

const finishOrderById = async (req, res, next) => {
    
    req.binnacleId = await addBinnacle(req);

    try {
        let updates = {};
        let order = await orderDetailsModel.aggregate([
            {
                $match:{_id:req._id}
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
        ]);

        const quantity = order[0].requiredQuantity;

        /// Actualizamos la cantidad entregada del trabajo
        let response
        if(req.body.equipment === undefined){
            response = await orderDetailsModel.findOneAndUpdate(
                {
                    _id:req._id
                },
                {
                    deliveredQuantity:req.body.deliveredQuantity, 
                    finished:true
                });
            updates = {
                _id: response._id,
                deliveredQuantity: response.deliveredQuantity,
                finished: response.finished
            }
        }
        else{
            response = await orderDetailsModel.findOneAndUpdate(
                {
                    _id:req._id
                },
                {
                    deliveredQuantity:req.body.deliveredQuantity, 
                    equipment:req.body.equipment,
                    finished:true
                });
            updates = {
                _id: response._id,
                deliveredQuantity: response.deliveredQuantity,
                equipment:response.equipment || '',
                finished: response.finished
            }
        }
        await nextStep(req._id);

        for(let itemMaterialJob of order[0].jobDetails.materials) {

            const cantidad = Number(((quantity * itemMaterialJob.required)/itemMaterialJob.produced)).toFixed(2);

            const material = await materialModel.findOne({_id : itemMaterialJob.idMaterial});

            const newUsed = Number(material.used - Number(cantidad)).toFixed(2);

            await materialModel.findByIdAndUpdate(
                {
                    _id:itemMaterialJob.idMaterial
                },
                {
                    used: newUsed
                },
                {
                    new:true
                }
            )
        }

        ///Verificacion de ordern completada
        if(response !== null){
            let order
            order = await orderExternalModel.findOne({_id:response.idOrder});
            if(order===null)
                order = await orderInternalModel.findOne({_id:response.idOrder});
            const details = await orderDetailsModel.find({idOrder:order._id});
            if(details.findIndex(item=>{return item.finished===false})===-1){
                let nameClient;
                let client;
                let detailsFormat = [];
                if(order.fundsOrigin){
                    nameClient = order.client;
                    client = await clientInternalModel.findOne({_id:order.idClient},'phone email')
                }
                else{
                    nameClient = `Señor ${order.client}`;
                    client = await clientExternalModel.findOne({_id:order.idClient},'phone email title')
                }
                details.map((item) => {
                    detailsFormat.push(`${item.deliveredQuantity} Unid${item.deliveredQuantity>1?'s.':'.'} de ${item.job}.`)
                })
                sendEmail(client.title||'', order.client, detailsFormat, client.email);
                sendMessage(`591${client.phone}@c.us`, nameClient, detailsFormat);
                
                
            }else{
                console.log('aun falta');
            }
        }

        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.ACCEPTED, oldValues: JSON.stringify(updates)});
        res.status(StatusCodes.ACCEPTED).send({message:ReasonPhrases.ACCEPTED});
    } catch(error){
        console.log(error);
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_FOUND});
        res.status(StatusCodes.NOT_MODIFIED).send({message: ReasonPhrases.NOT_MODIFIED});
    }
}

const cancelOrder = async(req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    try{   
        /// Cancelando orden Interna o Externa
        let order = await orderExternalModel.findOne({_id : req._id});
        if(!order)
            order = await orderInternalModel.findOne({_id : req._id});

        /// Cancelamos todos los trabajos de la orden
        if(order){
            const updates = {
                status: order.status
            }
            await orderDetailsModel.updateMany({idOrder : req._id, confirmed:false} , {status : false});

            let statusOrders = await orderDetailsModel.find({idOrder : req._id},'status');
            statusOrders = statusOrders.map(item=>{return item.status});
            if(!statusOrders.includes(true)){
                await orderExternalModel.findOneAndUpdate({_id : req._id},{status:false});
                await orderInternalModel.findOneAndUpdate({_id : req._id},{status:false});
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
    } catch(error){
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_MODIFIED});
        res.status(StatusCodes.NOT_MODIFIED).send({message: ReasonPhrases.NOT_MODIFIED});
    }
}

const getAllOrdersFinished = async(req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    let ordersExternal = await orderExternalModel.aggregate([
        {
            $match: {
                statusDelivered: false,
                numberCheck: {$ne : 0},
                status: true
            }
        },
        {
            $lookup: {
                from: 'orderdetails',
                localField: '_id',
                foreignField: 'idOrder',
                as: 'details'
            }
        },
        {
            $unwind: '$details'
        },
        {
            $lookup: {
                from: 'clientexternals',
                localField: 'idClient',
                foreignField: '_id',
                as: 'dataClient'
            }
        },
        {
            $unwind: '$dataClient'
        },
        {
            $group:{
                _id: '$_id',
                idClient: { $first: '$idClient' },
                client: { $first: '$client' },
                ci:{$first: '$dataClient.ci'},
                date: { $first: '$createdAt' },
                cost : { $first: '$cost' },
                status: { $first: '$status' },
                details: { $push: '$details'},
            }
        }
    ]);
    ordersExternal = ordersExternal.filter(item => {
        const details = item.details;
        for (let index = 0; index < details.length; index++) {
            const element = details[index];
            if(element.finished === false)
                return false
        }
        return true
    })

    let ordersInternal = await orderInternalModel.aggregate([
        {
            $match: {
                statusDelivered: false,
                status:true
            }
        },
        {
            $lookup: {
                from: 'orderdetails',
                localField: '_id',
                foreignField: 'idOrder',
                as: 'details'
            }
        },
        {
            $unwind: '$details'
        },
        {
            $lookup: {
                from: 'clientinternals',
                localField: 'idClient',
                foreignField: '_id',
                as: 'clientData'
            }
        },
        {
            $unwind: '$clientData'
        },
        {
            $group:{
                _id: '$_id',
                idClient: { $first: '$idClient' },
                client: { $first: '$client' },
                courier: {$first: '$clientData.courier'},
                date: { $first: '$createdAt' },
                cost : { $first: '$cost' },
                status: { $first: '$status' },
                details: { $push: '$details'},
                fundsOrigin: { $first: '$fundsOrigin'},
                
            }
        }
    ]);
    ordersInternal = ordersInternal.filter(item => {
        const details = item.details;
        for (let index = 0; index < details.length; index++) {
            const element = details[index];
            if(element.finished === false)
                return false
        }
        return true
    })

    const allOrders = ordersExternal.concat(ordersInternal);
    if(allOrders.length!==0){
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(allOrders));
    }else{
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

const finishTotalOrderById = async(req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    try {
        const finishDate = new Date()
        let order = await orderExternalModel.findOneAndUpdate({_id : req._id},{statusDelivered : true, dateDelivered:finishDate});
        if(!order)
            order = await orderInternalModel.findOneAndUpdate({_id : req._id},{statusDelivered : true, dateDelivered:finishDate});
        
        if(order){
            const updates = {
                statusDelivered: order.statusDelivered,
                dateDelivered: order.dateDelivered || ''
            }
            if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.ACCEPTED, oldValues: JSON.stringify(updates)});
            res.status(StatusCodes.ACCEPTED).send({message:ReasonPhrases.ACCEPTED});
        }else{
            if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_FOUND});
            res.status(StatusCodes.NOT_FOUND).send({message: ReasonPhrases.NOT_FOUND});
        }
    } catch (error) {
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_MODIFIED});
        res.status(StatusCodes.NOT_MODIFIED).send({message: ReasonPhrases.NOT_MODIFIED});
    }

    
}


module.exports = {
    getOrderById,
    getAllOdersList,
    getAllOdersListById,
    getAllOrdersNoConfirm, 
    confirmOrder, 
    getOrderFinishedById, 
    finishOrderById, 
    cancelOrder, 
    getAllOrdersFinished, 
    finishTotalOrderById
}