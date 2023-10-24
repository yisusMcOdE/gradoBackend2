const { ReasonPhrases, StatusCodes } = require("http-status-codes");
const { addBinnacle } = require("../binnacle/binnacleMiddleware");
const { binnacleModel } = require("../binnacle/binnacleSchema");
const { orderDetailsModel } = require("../orderDetails/orderDetailsSchema");
const { orderExternalModel } = require("../orderExternal/orderExternalSchema");
const { orderInternalModel } = require("../orderInternal.js/orderInternalSchema");

const getAreaReport = async (req,res,next) => {

    req.binnacleId = await addBinnacle(req);

    let areaFilter
    if(req.area==='Todos')
        areaFilter = new RegExp('.+');
    else
        areaFilter = new RegExp(req.area);

    let orders = await orderDetailsModel.aggregate([
        {
            $lookup:{
                from: 'steps',
                localField: '_id',
                foreignField: 'idOrderDetail',
                as: 'steps'
            }
        },
        {
            $unwind: '$steps'
        },
        {
            $lookup:{
                from: 'jobs',
                localField: 'idJob',
                foreignField: '_id',
                as: 'trabajo'
            }
        },
        {
            $unwind: '$trabajo'
        },
        {
            $group:{
                _id: '$_id',
                idOrder: { $first: '$idOrder' },
                status: { $first: '$status' },
                job: { $first: '$job' },
                detail: { $first: '$detail' },
                requiredQuantity: { $first: '$requiredQuantity' },
                days: { $first: '$days' },
                steps: { $push: '$steps'},
                area: { $first: '$trabajo.area'},
                cost: {$first: '$cost'}
            },
        },
        {
            $match:{
                steps: {
                    $elemMatch:{
                            'type': 'finished'                       
                    }
                },
                area : {
                    $regex : areaFilter
                }
            }
        }
    ])

    if(req.query.start!=='' && req.query.end!=='')
    {
        orders = orders.filter(item => {
            const filterStart = new Date(req.query.start);
            const filterEnd = new Date(req.query.end);
            const itemDate = new Date(item.steps.find(item => item.type==='finished').startedAt.toISOString().slice(0,10));

            console.log(filterStart);
            console.log(filterEnd);
            console.log(itemDate);

            return ((itemDate >= filterStart)&&(itemDate <= filterEnd))
        })
    }

    for (let index = 0; index < orders.length; index++) {
        const element = orders[index];
        let client = await orderInternalModel.findOne({_id:element.idOrder},'client fundsOrigin');
        if(client === null){
            client = await orderExternalModel.findOne({_id:element.idOrder},'client');
            orders[index].resource = 'Pago en Caja';
        }else{
            orders[index].resource = client.fundsOrigin;
        }
        orders[index].client = client.client;
    }
    const report = orders.map(item => {
        const _id = item._id;
        const fecha = item.steps.find(item => item.type==='finished').startedAt.toISOString().slice(0,10);
        const trabajo = item.job;
        const cliente = item.client;
        const detalle = item.detail;
        const recurso = item.resource;
        const cantidad = item.requiredQuantity;
        const precio = item.cost;
        return {
            _id,
            fecha,
            trabajo,
            cliente,
            detalle,
            recurso,
            cantidad,
            precio
        }
    })
    if(report!==null){
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(report));
    }else{
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

const getOrdersTotalFinished = async (req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    let ordersExternal = await orderExternalModel.aggregate([
        {
            $match: {
                statusDelivered: true,
                payStatus: true,
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
            $group:{
                _id: '$_id',
                client: { $first: '$client' },
                dateRegister: { $first: '$createdAt' },
                dateDelivered: {$first: '$dateDelivered'},
                cost : { $first: '$cost' },
                details: { $push: '$details'},
            }
        }
    ]);

    let ordersInternal = await orderInternalModel.aggregate([
        {
            $match: {
                statusDelivered: true,
                confirmed:true,
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
                dateRegister: { $first: '$createdAt' },
                dateDelivered: {$first: '$dateDelivered'},
                cost : { $first: '$cost' },
                details: { $push: '$details'},                
            }
        }
    ]);

    let allOrders = ordersExternal.concat(ordersInternal);

    allOrders.sort((a,b)=> (new Date(a.dateRegister)) - (new Date(b.dateRegister)));

    const finishReport = allOrders.map(item => {
        let jobs = '';
        item.details.map(job => {
            jobs += `${job.deliveredQuantity} ${job.job}${job.deliveredQuantity > 1 ? 's ':' '}- `
        });
        jobs = jobs.slice(0,jobs.length-3);

        return {
            _id: item._id,
            dateRegister: item.dateRegister?.toISOString().slice(0,10),
            dateDelivered: item.dateDelivered?.toISOString().slice(0,10),
            client: item.client,
            jobs: jobs,
            total: item.cost,
            details: item.details
        }
    });

    if(finishReport!==null){
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(finishReport));
    }else{
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

module.exports={getAreaReport, getOrdersTotalFinished}