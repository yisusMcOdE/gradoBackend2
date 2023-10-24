const {mongoose} = require('../../database/connection.js');

const schema = {
    idUser: { type: mongoose.Schema.Types.ObjectId, required:true },
    name: {type : String , required : true},
    phone: {type : String },
    status: {type: Boolean, default:true},
}

const employeeSchema = new mongoose.Schema (schema,{timestamps:true, versionKey:false});

const employeeModel = mongoose.model('employee', employeeSchema);

module.exports = {employeeModel}