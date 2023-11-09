const { mongoose } = require ('../../database/connection.js');
const { jobModel } = require('../job/jobSchema.js');
const { materialModel } = require('../material/materialSchema.js');

const schema = {
    idOrder : {type : mongoose.Types.ObjectId, required : true},
    idJob : {type : mongoose.Types.ObjectId, required : true},
    job:{type : String, required : true},
    detail:String,
    requiredQuantity : {type : Number, required : true},
    cost: {type : Number, required : true},
    deliveredQuantity : {type: Number, default:0},
    equipment:String,
    seconds: {type: Number, default:86400},
    status: {type: Boolean, default:true},
    finished: {type: Boolean, default:false},
    confirmed : {type: Boolean, default:false},

}

const orderDetailsSchema = new mongoose.Schema(schema,{timestamps:true, versionKey:false});

const orderDetailsModel = mongoose.model('orderDetail', orderDetailsSchema);

module.exports = {orderDetailsModel};