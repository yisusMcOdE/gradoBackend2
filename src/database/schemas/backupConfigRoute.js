const { mongoose } = require ('../connection.js');
const express = require ('express');
const { getbackupConfig, updateConfig, backupList, restoreBackup, generateBackUp } = require('./backupConfigMiddleware.js');


const backUpConfigRoute = express.Router();

backUpConfigRoute.get('', getbackupConfig);
backUpConfigRoute.get('/list', backupList);
backUpConfigRoute.post('',updateConfig);
backUpConfigRoute.post('/restore', restoreBackup);
backUpConfigRoute.post('/generate', generateBackUp);

module.exports = {backUpConfigRoute}