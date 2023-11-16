const { binnacleModel } = require("./binnacleSchema");
const jwt = require('jsonwebtoken');
const { StatusCodes, ReasonPhrases } = require("http-status-codes");
const { configServerModel } = require("../../config/configServer");

const addBinnacle = async (req, isLogin=false) => {
    try {
        const {registerGet, registerPost, registerPut} = await configServerModel.findOne({},'registerGet registerPost registerPut');
        const method = req.method;
        switch (method) {
            case 'GET':
                if(!registerGet){
                    return -1;
                }
                break;
            case 'POST':
                if(!registerPost){
                    return -1;
                }
                break;
            case 'PUT':
                if(!registerPut){
                    return -1;
                }
                break;
        }

        let user = ''
        if(!isLogin){
            const token = req.headers?.authorization?.slice(7);
            const decodedToken = jwt.decode(token);
            user = decodedToken?.data?.user;
        }
        
        const route = req.originalUrl;
        const params = (JSON.stringify(req.params));
        const queries = (JSON.stringify(req.query));
        const date = (new Date().toISOString().slice(0,10));
        const time = (new Date().toISOString().slice(11,19));
        const inputValues = (JSON.stringify(req.body));

        const newBinnacle = {
            user, 
            method, 
            route, 
            params, 
            queries, 
            date, 
            time,
            inputValues
        }

        const binnacle = new binnacleModel(newBinnacle);
        const response = await binnacle.save();
        return response._id;
    } catch (error) {
        
    }
}

const getAllBinnacle = async (req,res,next) => {

    req.binnacleId = await addBinnacle(req);

    let data = []
    if(req.query.user !== undefined){
        data = await binnacleModel.find({user:req.query.user});
    }else{
        data = await binnacleModel.find({});
    }

    if(data.length!==0){
        if(req.query.start!=='' && req.query.end!==''){
            data = data.filter(item => {
                const filterStart = new Date(req.query.start);
                const filterEnd = new Date(req.query.end);
                const itemDate = new Date(item.date);

                return ((itemDate >= filterStart)&&(itemDate <= filterEnd))
            })
        }
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(data));
    }else{
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message:ReasonPhrases.NO_CONTENT});
    }
}

const getBinnacleById = async (req,res,next) => {

    req.binnacleId = await addBinnacle(req);

    const response = await binnacleModel.findOne({_id : req._id});
    if(response!==null){
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(data));
    }else{
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

const getConfigBinnacle = async (req, res, next) => {

    try {
        req.binnacleId = await addBinnacle(req);
        const response = await  configServerModel.findOne({},'registerGet registerPost registerPut');
        console.log(response);

        if(response!==null){
            if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
            res.status(StatusCodes.OK).send(JSON.stringify(response));
        }else{
            if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
            res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
        }

    } catch (error) {
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CONFLICT});
        res.status(StatusCodes.CONFLICT).send({message: ReasonPhrases.CONFLICT});
    }
}

const updateConfigBinnacle = async (req,res,next) => {
    try {
        req.binnacleId = await addBinnacle(req);
        await configServerModel.updateOne({},req.body);
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send({message: ReasonPhrases.OK});
    } catch (error) {
        res.status(StatusCodes.CONFLICT).send({message: ReasonPhrases.CONFLICT});
    }
}

module.exports={getAllBinnacle, addBinnacle, getBinnacleById, getConfigBinnacle, updateConfigBinnacle}