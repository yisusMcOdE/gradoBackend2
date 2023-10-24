const {mongoose} = require ('../../database/connection.js');

const schema = {
    user: String,
    method: String,
    route: String,
    params: String,
    queries: String,
    date: String,
    time: String,
    inputValues: String,
    oldValues: String,
    successful: String,
}

const binnacleSchema = new mongoose.Schema(schema, {timestamps:true, versionKey:false});

const binnacleModel = mongoose.model('binnacle', binnacleSchema);

module.exports = {binnacleModel}