const { orderMaterialModel } = require('./orderMaterialSchema');
const { orderMaterialDetailModel } = require ('./orderMaterialDetailSchema');
const { mongoose } = require ('../../database/connection.js');
const { materialModel } = require('../material/materialSchema');
const { StatusCodes, ReasonPhrases } = require('http-status-codes');
const { addBinnacle } = require('../binnacle/binnacleMiddleware');
const { binnacleModel } = require('../binnacle/binnacleSchema');


const getAllOrderMaterials = async(req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    let response = await orderMaterialModel.aggregate([
        {
            $match:{
                status:true,
                statusDelivered:false
            }
        },
        {
            $lookup:{
                from :'ordermaterialdetails', 
                localField:'_id', 
                foreignField:'idOrderMaterial', 
                as:'details'
            }
        },
        {
            $unwind: '$details'
        },
        {
            $lookup: {
                from: 'materials',
                localField: 'details.idMaterial',
                foreignField: '_id',
                as: 'details.material'
            }
        },
        {
            $unwind: '$details.material'
        },
        {
            $group:{
                _id: '$_id',
                createdAt: { $first: '$createdAt' },
                details: { $push: '$details' }
            }
        }
    ]);
    if(response.length!==0){
        response = response.map(item=>{
            let detailsFormated = ''
            item.details.map((itemDetail,index)=>{
                detailsFormated += `${itemDetail.material.name} (${itemDetail.requiredQuantity}), `;
                if(index === item.details.length-1)
                    detailsFormated = detailsFormated.slice(0,-2) + '.';
            })
            item.details = detailsFormated;
            item.createdAt = item.createdAt.toISOString().slice(0,10);
            return item;
        })
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(response));
    }else{
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

const getOrderMaterialById = async (req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    let response = await orderMaterialModel.aggregate([
        {
            $match:{
                status:true,
                _id:req._id
            }
        },
        {
            $lookup:{
                from :'ordermaterialdetails', 
                localField:'_id', 
                foreignField:'idOrderMaterial', 
                as:'details'
            }
        },
        {
            $unwind: '$details'
        },
        {
            $lookup: {
                from: 'materials',
                localField: 'details.idMaterial',
                foreignField: '_id',
                as: 'details.material'
            }
        },
        {
            $unwind: '$details.material'
        },
        {
            $group:{
                _id: '$_id',
                createdAt: { $first: '$createdAt' },
                statusDelivered: { $first: '$statusDelivered' },
                details: { $push: '$details' }
            }
        }
    ]);
    if(response!==null){
        response = response[0];
        let detailsFormated = ''
        response.details = response.details.map((itemDetail,index)=>{
            detailsFormated += `${itemDetail.material.name} (${itemDetail.requiredQuantity}), `;
            if(index === response.details.length-1)
                detailsFormated = detailsFormated.slice(0,-2) + '.';
            itemDetail.materialName = itemDetail.material.name;
            delete itemDetail.material;
            return itemDetail
        })
        response.detailsResumen = detailsFormated;
        
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(response));
    }else{
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

const addOrderMaterials = async (req,res,next) => {

    req.binnacleId = await addBinnacle(req);

    try {    
        /// Creando order global
        const responseOrder = await orderMaterialModel.create({});

        /// Preparando cada detalle de la orden
        const idOrder = responseOrder._id;
        let details = req.body.details;
        details = details.map(item => {
            return {
                ...item, 
                idOrderMaterial: new mongoose.Types.ObjectId(idOrder),
                idMaterial: new mongoose.Types.ObjectId(item.idMaterial)
            }
        });

        /// Creando todas las ordenes
        await orderMaterialDetailModel.create(details);
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CREATED});
        res.status(StatusCodes.CREATED).send({message:ReasonPhrases.CREATED});

    } catch (error) {
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_IMPLEMENTED});
        res.status(StatusCodes.NOT_IMPLEMENTED).send({message: ReasonPhrases.NOT_IMPLEMENTED});
    }
}

const confirmOrderMaterial = async (req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    try {    
        

        const response = await orderMaterialModel.updateOne({_id:req._id},{statusDelivered:true, deliveredDate:(new Date())});
        const updates = {
            statusDelivered:response.statusDelivered,
            deliveredDate:response.deliveredDate || ''
        };

        if(req.body.complete){
            await orderMaterialDetailModel.find({idOrderMaterial:req._id}).then(doc=>{
                try {
                    doc.forEach(async(item)=>{
                        item.deliveredQuantity = item.requiredQuantity;
                        await item.save();
    
                        const response = await materialModel.findOneAndUpdate(
                        {
                            _id : item.idMaterial
                        },
                        {
                            $inc:{available: item.requiredQuantity}
                        });
                    })
                } catch (error) {
                    console.log(error)
                }
            })
        }else{
            req.body.details.map(async(item)=>{
                
                let response = await orderMaterialDetailModel.findOneAndUpdate(
                    {
                        _id : item._id,
                        idOrderMaterial : req._id
                    },
                    {
                        deliveredQuantity : item.deliveredQuantity
                    }
                )
                response = await materialModel.findOneAndUpdate(
                    {
                        _id : response.idMaterial
                    },
                    {
                        $inc:{available: item.deliveredQuantity}
                    }
                )
            })
        }
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.ACCEPTED, oldValues: JSON.stringify(updates)});
        res.status(StatusCodes.ACCEPTED).send({message: ReasonPhrases.ACCEPTED});
    }catch (error) {
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_FOUND});
        res.status(StatusCodes.NOT_MODIFIED).send({message: ReasonPhrases.NOT_MODIFIED});
    }
}

const cancelOrderMaterial = async(req, res, next) => {
    req.binnacleId = await addBinnacle(req);

    try{   
        /// Cancelando orden Interna o Externa
        let order = await orderMaterialModel.findOneAndUpdate({_id : req._id}, {status : false});

        if(order){
            const updates = {
                status: order.status
            }
            await orderMaterialDetailModel.updateMany({idOrder : req._id}, {status : false});
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

module.exports = {getAllOrderMaterials, addOrderMaterials, confirmOrderMaterial, getOrderMaterialById, cancelOrderMaterial}
