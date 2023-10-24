const {mongoose} = require('../../database/connection.js');

const equipmentSchema = new mongoose.Schema({
    name: {type : String, unique : true , required : true},
    brand: {type : String, required : true},
    status: {type: Boolean, default:true}
},{timestamps:true, versionKey:false});

const equipmentModel = mongoose.model('equipment', equipmentSchema);

module.exports = {equipmentModel}