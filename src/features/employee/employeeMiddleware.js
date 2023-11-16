const { employeeModel } = require ('./employeeSchema');
const jwt = require('jsonwebtoken');
const { ReasonPhrases, StatusCodes } = require('http-status-codes');
const { addBinnacle } = require('../binnacle/binnacleMiddleware');
const { binnacleModel } = require('../binnacle/binnacleSchema');
const { userModel } = require('../users/usersSchema');
const { mongoose } = require ('../../database/connection.js');


const getCredentialsEmployee = async (req,res,next) => {

    req.binnacleId = await addBinnacle(req, true);
    if(true){
        const user = req.body.user;
        const password = req.body.password;
        const data = await userModel.findOne({user, password, status:true}, '_id user role');
        if(data!==null){
            var token = jwt.sign({data},'imprenta');
            if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
            res.status(StatusCodes.OK).send(JSON.stringify({token}));
        }else{
            if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
            res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
        }
    }
}

const getAllEmployee = async(req, res, next) => {
    req.binnacleId = await addBinnacle(req);

    const data = await employeeModel.find({});

    if(data.length!==0){
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(data));
    }else{
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

const getEmployeeById = async (req, res) => {

    req.binnacleId = await addBinnacle(req);

    const data = await employeeModel.findOne({_id:req._id});

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

const addEmployee = async (req, res) => {

    req.binnacleId = await addBinnacle(req);
    let userResponse;

    try {
        /// Se crea Usuario
        userResponse = await userModel.create({
            user:req.body.user,
            password:req.body.password,
            role:req.body.role
        });

        /// Se crea Empleado
        await employeeModel.create({
            idUser: new mongoose.Types.ObjectId(userResponse._id),
            name:req.body.name,
            phone:req.body.phone,
        })

        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CREATED});
        res.status(StatusCodes.CREATED).send({message:ReasonPhrases.CREATED});
    } catch (error) {
        console.log(error);
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_IMPLEMENTED});
        if(userResponse)
            await userModel.deleteOne({_id:userResponse._id})
        if(error.code===11000)
            res.status(StatusCodes.NOT_IMPLEMENTED).send({message: ReasonPhrases.NOT_IMPLEMENTED, reason:`${error.keyValue.user} ya existe`});
        else
            res.status(StatusCodes.NOT_IMPLEMENTED).send({message: ReasonPhrases.NOT_IMPLEMENTED});
    
    }
}

const updateEmployee = async (req, res) => {

    req.binnacleId = await addBinnacle(req);

    try {


            const response = await employeeModel.findOneAndUpdate({_id:req._id}, req.body);

            if(response !== null){
                const updates = {};
                for (const key in req.body) {
                    updates[key] = response[key]
                }
                if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.ACCEPTED, oldValues: JSON.stringify(updates)});
                res.status(StatusCodes.ACCEPTED).send({message:ReasonPhrases.ACCEPTED});
            }else{
                if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_FOUND});
                res.status(StatusCodes.NOT_FOUND).send({message:ReasonPhrases.NOT_FOUND});
            }
    } catch (error) {
        if(error.code===11000){
            if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CONFLICT});
            res.status(StatusCodes.CONFLICT).send();
        }else{
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_MODIFIED});
        res.status(StatusCodes.NOT_MODIFIED).send({message: ReasonPhrases.NOT_MODIFIED});}
    }
}


module.exports = {getCredentialsEmployee, getAllEmployee, getEmployeeById, addEmployee, updateEmployee}