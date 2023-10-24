const schedule = require('node-schedule');
const mongoose = require ('mongoose');
const { exec } = require('child_process');
const backup = require('mongodb-backup');
const { MongoClient } = require("mongodb");
const fs = require('fs');
const { backupConfigModel } = require('../database/schemas/backupConfigSchema');


const idConfig = new mongoose.Types.ObjectId('648e4b2d3b2ce31d5c9c5d0f') 


const backupFunction = async () => {

    const date = Date.now();

    const dbConfig = 'mongodb://mongo/imprenta';
    const archive = `../backupMongo/BackUp_${date}_.gz`;

    const command = `mongodump --archive=${archive} --gzip --uri=${dbConfig} `;

    exec(command,(error, stdout, stderr) => {
        if (error) {
          console.error('Error al generar la copia de respaldo:', error);
          throw new Error('Error al generar la copia de respaldo')
        } else {
          console.log('Copia de respaldo generada correctamente');
          return true
        }
    });
}

const backupTask = async () => {

  const idConfig = new mongoose.Types.ObjectId('648e4b2d3b2ce31d5c9c5d0f') 
  const dataConfig = await backupConfigModel.findOne({_id:idConfig});
    
  let rule = new schedule.RecurrenceRule();
  rule.second = dataConfig.interval;

  if(dataConfig.status){
    schedule.scheduleJob('myBackUpTask',rule, backupFunction)
    console.log('servicio de copia de respaldo habilitado');
  }else{
    console.log('servicio de copia de respaldo inhabilitado');
  }

}

const updatebackupService = async() => {
  console.log('reconfigurando tarea');
  const configUpdate = await backupConfigModel.findOne({_id:idConfig});
  let rule = new schedule.RecurrenceRule();
  rule.second = configUpdate.interval;

  if(configUpdate.status){
    if(schedule.scheduledJobs['myBackUpTask']){
      const tarea = schedule.scheduledJobs['myBackUpTask'];
      tarea.reschedule(rule);
      
    }else{
      schedule.scheduleJob('myBackUpTask',rule, backupFunction)
    }
  }else{
    if(schedule.scheduledJobs['myBackUpTask']){
      schedule.scheduledJobs['myBackUpTask'].cancel();
    }
  }
}

const restoreBackupByName = async (archive) => {
  console.log('RESTAURANDO BASE DE DATOS ');
  const dbConfig = 'mongodb://mongo/imprenta';
  const command = `mongorestore --archive=../backupMongo/${archive} --gzip --uri=${dbConfig} --drop`;
  exec(command,(error, stdout, stderr) => {
    if (error) {
      console.error('Error al restaurar la base de datos', error);
      throw new Error('error')
    } else {
      console.log('RESTAURACION COMPLETA');
      return true
    }
  });
}

module.exports={backupTask, updatebackupService, restoreBackupByName, backupFunction}