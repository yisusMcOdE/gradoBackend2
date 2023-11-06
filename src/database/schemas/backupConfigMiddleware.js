const { default: mongoose } = require("mongoose");
const { updatebackupService, restoreBackupByName, backupFunction } = require("../../schedules/backUp");
const { backupConfigModel } = require("./backupConfigSchema");
const fs = require('fs');
const path = require('path');
const { addBinnacle } = require("../../features/binnacle/binnacleMiddleware");
const { binnacleModel } = require("../../features/binnacle/binnacleSchema");
const { StatusCodes, ReasonPhrases } = require("http-status-codes");
const { configServerModel } = require("../../config/configServer");


const getbackupConfig = async (req, res, next) => {
    let data = await configServerModel.findOne({});
    res.status(200).send(data);
}

const backupList = async (req, res, next) => {

    req.binnacleId = await addBinnacle(req);

    const folderbackUp = '../backupMongo/';
    fs.readdir(folderbackUp, async(err, files) => {
        if (err) {
            console.error(`Error al leer la carpeta: ${err}`);
            return;
        }

        const list = [];
        // Recorrer los archivos y obtener los metadatos
        for (const file of files) {

            const filePath = path.join(folderbackUp, file);
            try {
              const stats = await fs.promises.stat(filePath);
              const fileObj = {
                name: file,
                size: `${stats.size} bytes`,
                createAt: stats.birthtime
              };
              list.push(fileObj);
            } catch (error) {
              console.error(`Error al obtener los metadatos de ${file}: ${error}`);
            }
        }

        if(list.length!==0){
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
            res.status(StatusCodes.OK).send(JSON.stringify(list));
        }else{
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NO_CONTENT});
            res.status(StatusCodes.NO_CONTENT).send({message: ReasonPhrases.NO_CONTENT});
        }
    });
}

const updateConfig = async (req, res, next) => {
    req.binnacleId = await addBinnacle(req);
    try {
        let response = await configServerModel.findOneAndUpdate({},req.body);
        if(response!==null){
            updatebackupService();
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
    } catch (error) {
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_MODIFIED});
        res.status(StatusCodes.NOT_MODIFIED).send();
    }
}

const restoreBackup = async (req, res, next) => {
    try {
        await restoreBackupByName(req.body.archive, req.body.code);
        res.status(StatusCodes.ACCEPTED).send();
    } catch (error) {
        res.status(StatusCodes.NOT_MODIFIED).send();
    }
}

const generateBackUp = async (req, res, next) => {

    req.binnacleId = await addBinnacle(req);
    try {
        await backupFunction();
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CREATED});
        res.status(StatusCodes.CREATED).send();
    } catch (error) {
        console.log(error)
        await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.NOT_IMPLEMENTED}); 
        res.status(StatusCodes.NOT_IMPLEMENTED).send({message: ReasonPhrases.NOT_IMPLEMENTED});
    }
}

module.exports = {getbackupConfig, updateConfig, backupList, restoreBackup, generateBackUp}