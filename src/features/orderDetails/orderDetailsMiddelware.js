const { ReasonPhrases, StatusCodes } = require("http-status-codes");
const { addBinnacle } = require("../binnacle/binnacleMiddleware");
const { binnacleModel } = require("../binnacle/binnacleSchema");
const { orderExternalModel } = require("../orderExternal/orderExternalSchema");
const { orderInternalModel } = require("../orderInternal.js/orderInternalSchema");
const { orderDetailsModel } = require("./orderDetailsSchema");


const getAllOrderDetailsConfirmed = async (req,res,next) => {

    req.binnacleId = await addBinnacle(req);

    let response = await orderDetailsModel.aggregate([
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
                area: { $first: '$trabajo.area'}
            }
        },
        {
            $match:{
                steps: {
                    $elemMatch:{
                            'type': 'scheduled'                       
                    }
                }
            }
        }
    ]);
    const promises = response.map(async(item) => {
        let nameClient = await orderExternalModel.findOne({_id : item.idOrder});
        if(nameClient===null){
            nameClient = await orderInternalModel.findOne({_id: item.idOrder});
        }
        return {...item, client:nameClient.client}
    }) 

    const promiseResponse = await Promise.all(promises);

    if(promiseResponse!==null){
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(promiseResponse));
    }else{
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }

}

const getOrdersDelayed = async(req,res,nex) => {

    req.binnacleId = await addBinnacle(req);

    let response = await orderDetailsModel.aggregate([
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
            $group:{
                _id: '$_id',
                steps: { $push: '$steps'},
            }
        },
        {
            $match:{
                steps: {
                    $elemMatch:{
                            'type': 'delayed'                       
                    }
                }
            }
        }
    ])
    response = response.filter(item=>{
        const [last] = item.steps.slice(-1);
        return(last.type==='delayed')
    })
    response = response.map(item => {return {id:item._id}})
    if(response!==null){
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(response));
    }else{
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

module.exports={getAllOrderDetailsConfirmed, getOrdersDelayed}