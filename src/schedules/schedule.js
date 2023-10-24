const { orderDetailsModel } = require("../features/orderDetails/orderDetailsSchema");
const express = require ('express');
const { mongoose } = require ('../database/connection.js');
const { stepModel } = require("../features/step/stepSchema");
const { binnacleModel } = require("../features/binnacle/binnacleSchema");
const { addBinnacle } = require("../features/binnacle/binnacleMiddleware");
const { ReasonPhrases, StatusCodes } = require("http-status-codes");


/// MIDDLEWARE


const generateSchedule = async(req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    let cronogramaImpresion = [];
    let cronogramaEmpastado = [];
    let cronogramaOffset = [];
    let cronogramaTodos = [];

    let cronogramaColaImpresion = [];
    let cronogramaColaEmpastado = [];
    let cronogramaColaOffset = [];
    let cronogramaColaTodos = [];


    /// 1° Tomar todos los trabajos con step 'scheduled' agendado

    let agendados = await orderDetailsModel.aggregate([
        {
            $lookup:{
                from: 'steps',
                localField: '_id',
                foreignField: 'idOrderDetail',
                as: 'steps',
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
                detail: { $first: '$detail' },
                requiredQuantity: { $first: '$requiredQuantity' },
                job: { $first: '$job'},
                seconds: { $first: '$seconds' },
                area: { $first: '$trabajo.area'},
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
    ])


    /// 2° Tomar todos los trabajos con step 'develop' desarrollo filtrando los finalizados

    let desarrollados = agendados.filter(item => {
        return (item.steps.find(itemStep => {
            return itemStep.type === 'develop'
        }))!==undefined
    })

    desarrollados = desarrollados.filter(item => {
        return (item.steps.find(itemStep => {
            return itemStep.type === 'finished'
        }))===undefined
    })

    /// 3° Agregar fecha de inicio como dato primario a partir de la fecha de inicio de desarrollo
    /// el dato viene de steps > develop > startedAt

    desarrollados = desarrollados.map(item => {
        return {...item, name:item.job, start: new Date(item.steps[3].startedAt), progress: 100}
    })


    /// 4° Dividir por areas

    desarrollados.map(item=>{
        cronogramaTodos.push(item);
        switch (item.area) {
            case 'Impresion':
                cronogramaImpresion.push(item);
                break;
            case 'Empastado':
                cronogramaEmpastado.push(item);
            break;
            case 'Offset':
                cronogramaOffset.push(item);
            break;
            default:
                break;
        }
    })


    /// 5° Ordenar ascendentemente por fecha de inicio de desarrollo

    cronogramaTodos.sort((a,b)=> (new Date(a.start)) - (new Date(b.start)))
    cronogramaImpresion.sort((a,b)=> (new Date(a.start)) - (new Date(b.start)))
    cronogramaEmpastado.sort((a,b)=> (new Date(a.start)) - (new Date(b.start)))
    cronogramaOffset.sort((a,b)=> (new Date(a.start)) - (new Date(b.start)))


    /// 6° Asignar fecha de entrega aproximado por fecha inicio + dias o fecha actual

    const getEndDate = (item) => {
        
        let daysDelayed = 0;
        item.steps.map(item => {
            if(item.type === 'delayed'){
                daysDelayed += item.dayDelay;
            }
        })


        let end = new Date(item.start);
        end.setSeconds(end.getSeconds() + item.seconds);
        end.setHours(end.getHours() + (daysDelayed*24));

        return end
    }

    cronogramaTodos = cronogramaTodos.map(item => {
        return {...item, end: getEndDate(item)}
    })
    cronogramaEmpastado = cronogramaEmpastado.map(item => {
        return {...item, end: getEndDate(item)}

    })
    cronogramaImpresion = cronogramaImpresion.map(item => {
        return {...item, end: getEndDate(item)}

    })
    cronogramaOffset = cronogramaOffset.map(item => {
        return {...item, end: getEndDate(item)}

    })


    /// 7° Obtener todos los trabajos con step 'scheduled' agendado pero no procesado

    let noDesarrollados = agendados.filter(item => {
        return (item.steps.find(itemStep => {
            return itemStep.type === 'develop'
        }))===undefined
    })


    /// 8° Dividir por areas
    
    noDesarrollados.map(item=>{
        cronogramaColaTodos.push(item);
        switch (item.area) {
            case 'Impresion':
                cronogramaColaImpresion.push(item);
                break;
            case 'Empastado':
                cronogramaColaEmpastado.push(item);
            break;
            case 'Offset':
                cronogramaColaOffset.push(item);
            break;
            default:
                break;
        }
    })


    /// 9° Ordenar las ordenes en base a la fecha de confirmacion o agendado

    cronogramaColaTodos.sort((a,b)=> (new Date(a.steps[2].startedAt)) - (new Date(b.steps[2].startedAt)))
    cronogramaColaImpresion.sort((a,b)=> (new Date(a.steps[2].startedAt)) - (new Date(b.steps[2].startedAt)))
    cronogramaColaEmpastado.sort((a,b)=> (new Date(a.steps[2].startedAt)) - (new Date(b.steps[2].startedAt)))
    cronogramaColaOffset.sort((a,b)=> (new Date(a.steps[2].startedAt)) - (new Date(b.steps[2].startedAt)))


    /// 10° Asignamos fecha de inicio y fin para las ordenes de manera secuencial tomando en cuenta todas las ordenes
    
    let fechaInicio;
    let fechaFin;

    cronogramaColaTodos = cronogramaColaTodos.map((item, index) => {
        if(index===0){
            if(cronogramaTodos.length!==0){
                fechaInicio = new Date (cronogramaTodos[cronogramaTodos.length - 1].end);
            }else{
                fechaInicio = new Date ();
                ///fechaInicio.setDate(fechaInicio.getDate() + 1);
            }
            fechaFin = new Date(fechaInicio);
            fechaFin.setDate(fechaFin.getDate()+1);
        }else{
            fechaInicio = new Date(fechaFin);
            fechaFin = new Date(fechaInicio);
            fechaFin.setDate(fechaFin.getDate()+1);
        }
        return {...item, start:fechaInicio, end:fechaFin, progress:0}
    })

    cronogramaColaImpresion = cronogramaColaImpresion.map((item, index) => {

        if(index===0){
            if(cronogramaImpresion.length!==0){
                fechaInicio = new Date (cronogramaImpresion[cronogramaImpresion.length - 1].end);
            }else{
                fechaInicio = new Date ();
                ///fechaInicio.setDate(fechaInicio.getDate() + 1);
            }
            fechaFin = new Date(fechaInicio);
            fechaFin.setDate(fechaFin.getDate()+1);
        }else{
            fechaInicio = new Date(fechaFin);
            fechaFin = new Date(fechaInicio);
            fechaFin.setDate(fechaFin.getDate()+1);
        }
        return {...item, start:fechaInicio, end:fechaFin, progress:0}

    })

    cronogramaColaEmpastado = cronogramaColaEmpastado.map((item, index) => {
        if(index===0){
            if(cronogramaEmpastado.length!==0){
                fechaInicio = new Date (cronogramaEmpastado[cronogramaEmpastado.length - 1].end);
            }else{
                fechaInicio = new Date ();
                ///fechaInicio.setDate(fechaInicio.getDate() + 1);
            }
            fechaFin = new Date(fechaInicio);
            fechaFin.setDate(fechaFin.getDate()+1);
        }else{
            fechaInicio = new Date(fechaFin);
            fechaFin = new Date(fechaInicio);
            fechaFin.setDate(fechaFin.getDate()+1);
        }
        return {...item, start:fechaInicio, end:fechaFin, progress:0}
    })

    cronogramaColaOffset = cronogramaColaOffset.map((item, index) => {
        if(index===0){
            if(cronogramaColaOffset.length!==0){
                fechaInicio = new Date (cronogramaColaOffset[cronogramaColaOffset.length - 1].end);
            }else{
                fechaInicio = new Date ();
                ///fechaInicio.setDate(fechaInicio.getDate() + 1);
            }
            fechaFin = new Date(fechaInicio);
            fechaFin.setDate(fechaFin.getDate()+1);
        }else{
            fechaInicio = new Date(fechaFin);
            fechaFin = new Date(fechaInicio);
            fechaFin.setDate(fechaFin.getDate()+1);
        }
        return {...item, start:fechaInicio, end:fechaFin, progress:0}
    })


    /// 11° Agregar al array final del cronograma 

    cronogramaTodos = cronogramaTodos.concat(cronogramaColaTodos);
    cronogramaEmpastado = cronogramaEmpastado.concat(cronogramaColaEmpastado);
    cronogramaImpresion = cronogramaImpresion.concat(cronogramaColaImpresion);
    cronogramaOffset = cronogramaOffset.concat(cronogramaColaOffset);

    /// 12° Agregar el nombre de las ordenes

    cronogramaTodos = cronogramaTodos.map(item => {return{...item, name: item.job}})
    cronogramaEmpastado = cronogramaEmpastado.map(item => {return{...item, name: item.job}})
    cronogramaImpresion = cronogramaImpresion.map(item => {return{...item, name: item.job}})
    cronogramaOffset = cronogramaOffset.map(item => {return{...item, name: item.job}})

    /// 13° Agregando Type a todos

    cronogramaTodos = cronogramaTodos.map(item => {return{...item, type: 'task'}})
    cronogramaEmpastado = cronogramaEmpastado.map(item => {return{...item, type: 'task'}})
    cronogramaImpresion = cronogramaImpresion.map(item => {return{...item, type: 'task'}})
    cronogramaOffset = cronogramaOffset.map(item => {return{...item, type: 'task'}})

    console.log(cronogramaTodos);


    const jsonresponse = JSON.stringify({
        Imprenta : cronogramaImpresion,
        Empastado : cronogramaEmpastado,
        Offset : cronogramaOffset,
        Todos : cronogramaTodos
    });
    
    await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
    res.status(StatusCodes.OK).send(jsonresponse);
}

const updateSchedule = async (req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    try {
        const promises = req.body.map(async(item) => {
            const _id = new mongoose.Types.ObjectId(item.id);
            await stepModel.findOneAndUpdate({idOrderDetail:_id, type:'develop'},{startedAt:item.start});
            await orderDetailsModel.findOneAndUpdate({_id:_id}, {seconds:item.seconds});
        })
        Promise.all(promises).then(async()=>{
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.Ok});
            res.status(StatusCodes.OK).send({message: ReasonPhrases.OK});
        })
    } catch (error) {
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_IMPLEMENTED});
        res.status(StatusCodes.NOT_IMPLEMENTED).send({message: ReasonPhrases.NOT_IMPLEMENTED});
    }

    
}


/// ROUTES

const scheduledRoute = express.Router();

scheduledRoute.get('/generate',generateSchedule);
scheduledRoute.put('/update',updateSchedule);

module.exports = {scheduledRoute, updateSchedule}