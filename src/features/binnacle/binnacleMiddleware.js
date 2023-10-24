const { binnacleModel } = require("./binnacleSchema");
const jwt = require('jsonwebtoken');
const { StatusCodes, ReasonPhrases } = require("http-status-codes");

const addBinnacle = async (req, isLogin=false) => {
    let user = ''
    if(!isLogin){
        const token = req.headers.authorization.slice(7);
        const decodedToken = jwt.decode(token);
        user = decodedToken.data.user;
    }
    

    const method = req.method;
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

}

const getAllBinnacle = async (req,res,next) => {

    req.binnacleId = await addBinnacle(req);

    let data = []
    if(req.query.user !== undefined){
        data = await binnacleModel.find({user:req.query.user});
    }else{
        data = await binnacleModel.find({});
    }

    if(data!==null){
        if(req.query.start!=='' && req.query.end!==''){
            data = data.filter(item => {
                const filterStart = new Date(req.query.start);
                const filterEnd = new Date(req.query.end);
                const itemDate = new Date(item.date);

                return ((itemDate >= filterStart)&&(itemDate <= filterEnd))
            })
        }
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(data));
    }else{
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message:ReasonPhrases.NO_CONTENT});
    }
}

const getBinnacleById = async (req,res,next) => {

    req.binnacleId = await addBinnacle(req);

    const response = await binnacleModel.findOne({_id : req._id});
    if(response!==null){
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(data));
    }else{
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}



module.exports={getAllBinnacle, addBinnacle, getBinnacleById}