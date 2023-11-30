const { mongoose } = require ('../../database/connection.js');
const schema = {
    idClient : { type: mongoose.Types.ObjectId, ref: 'clients' },
    client : {type : String, required : true},
    dateDelivered : Date,
    cost : {type : Number, required : true},
    fundsOrigin : {type : String, required : true},
    status: {type: Boolean, default:true},
    statusDelivered : {type: Boolean, default:false},
    numberMinute: { type : Number, unique : true },
}

const orderInternalSchema = new mongoose.Schema(schema,{timestamps:true, versionKey:false});

const orderInternalModel = mongoose.model('orderInternal', orderInternalSchema);

module.exports = {orderInternalModel};