const { mongoose } = require ('../../database/connection.js');

const schema = {
    idUser: { type: mongoose.Types.ObjectId, ref: 'users', required:true },
    institution : {type : String , unique : true, required : true},
    email : {type : String ,unique: true},
    courier: {type : String, required : true},
    phone : {type : String , unique : true},
    address : {type : String },
    status: {type: Boolean, default:true},}

const clientSchema = new mongoose.Schema(schema,{timestamps:true, versionKey:false});

const clientInternalModel = mongoose.model('clientInternal', clientSchema);

module.exports = {clientInternalModel};