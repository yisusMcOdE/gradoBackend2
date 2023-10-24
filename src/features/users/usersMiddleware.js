const { ReasonPhrases, StatusCodes } = require("http-status-codes");
const { addBinnacle } = require("../binnacle/binnacleMiddleware");
const { binnacleModel } = require("../binnacle/binnacleSchema");
const { clientInternalModel } = require("../clientInternal/clientInternalSchema");
const { employeeModel } = require("../employee/employeeSchema");
const { userModel } = require("./usersSchema");


const getAllUsers = async (req, res,next)=> {

    req.binnacleId = await addBinnacle(req);

    const data = await userModel.find({},'user');


    if(data!==[]){
        res.status(StatusCodes.OK).send(JSON.stringify(data));
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
    }else{
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});

    }
}

const getAllUsersComplete = async (req, res,next)=> {

    req.binnacleId = await addBinnacle(req);

    let dataInstitution = await clientInternalModel.aggregate([
        {
            $lookup:{
                from :'users', 
                localField:'idUser', 
                foreignField:'_id',
                as:'user'
            }
        },
        {
            $unwind: '$user'
        },
        {
            $group: {
              _id: '$user._id',
              institution: { $first: '$institution' },
              user:{$first: '$user.user'},
              role:{ $first: '$user.role'},
              status: {$first: '$user.status'},
            }
        }
    ]);
    const dataEmployee = await employeeModel.aggregate([
        {
            $lookup:{
                from :'users', 
                localField:'idUser', 
                foreignField:'_id',
                as:'user'
            }
        },
        {
            $unwind: '$user'
        },
        {
            $group: {
              _id: '$user._id',
              name: { $first: '$name' },
              user:{$first: '$user.user'},
              role:{ $first: '$user.role'},
              status: {$first: '$user.status'},
            }
        }
    ]);
    const data = {
        institution: dataInstitution,
        employee: dataEmployee
    }



    if( dataInstitution.length!==0 || dataEmployee.length!==0 ){
        res.status(StatusCodes.OK).send(JSON.stringify(data));
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
    }else{
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
    }
}

const getUserById = async (req, res, next) => {
    req.binnacleId = await addBinnacle(req);

    const data = await userModel.findOne({_id:req._id});
    if(data!==null){
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(data));
    }else{
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
        res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
    }
}

const updateUser = async (req, res) => {

    req.binnacleId = await addBinnacle(req);

    try{
        const response = await userModel.findOneAndUpdate({_id:req._id}, req.body,{runValidators: true});
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
        if(error.code===11000){
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CONFLICT});
            res.status(StatusCodes.CONFLICT).send();
        }else{
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_MODIFIED});
            res.status(StatusCodes.NOT_MODIFIED).send();}
    }
}

module.exports = {getAllUsers, getAllUsersComplete, getUserById, updateUser}