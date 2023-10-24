const { mongoose } = require ('../../database/connection.js');

const schema = {
    status: {type: Boolean, default:true},
    statusDelivered : {type: Boolean, default:false},
    deliveredDate : {type: Date}
}

const orderMaterialSchema = new mongoose.Schema(schema,{timestamps:true, versionKey:false});

const orderMaterialModel = mongoose.model('orderMaterial', orderMaterialSchema);

module.exports = {orderMaterialModel};