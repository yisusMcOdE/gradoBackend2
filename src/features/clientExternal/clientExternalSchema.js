const { mongoose } = require ('../../database/connection.js');

const typesTitle = ['Señor', 'Señora'];

const schema = {
    title: { type : String ,enum: typesTitle, required : true },
    ci: {type : String , unique : true, minlength:8, required : true},
    name : { type : String , required : true },
    phone : { type : String , unique : true },
    email : { type : String, unique : true },
    status: {type: Boolean, default:true}
}

const clientExternalSchema = new mongoose.Schema(schema,{timestamps:true, versionKey:false});

const clientExternalModel = mongoose.model('clientExternal', clientExternalSchema);

module.exports = {clientExternalModel}