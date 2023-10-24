const { mongoose } = require ('../connection.js');

const schema = {
    interval : Number,
    status: Boolean
}

const backupConfigSchema = new mongoose.Schema(schema,{timestamps:true, versionKey:false});

const backupConfigModel = mongoose.model('backUpConfig', backupConfigSchema);

module.exports = {backupConfigModel}