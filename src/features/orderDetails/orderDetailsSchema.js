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

orderDetailsSchema.post('save',async(doc)=>{

    /*

    const requiredQuantity = doc.requiredQuantity;

    const job = await jobModel.findOne({_id:doc.idJob});

    for (let index = 0; index < job.materials.length; index++) {
        const item = job.materials[index];
        const idMaterial = item.idMaterial;

        const reserved = Number((requiredQuantity * item.required) / item.produced).toFixed(2);
        const available = Number(((requiredQuantity * item.required) / item.produced)).toFixed(2);

        const material = await materialModel.findOne({_id : idMaterial});

        const newReserved = Number(material.reserved + Number(reserved)).toFixed(2);
        const newAvailable = Number(material.available - Number(available)).toFixed(2);

        const response = await materialModel.findOneAndUpdate(
            {
                _id: idMaterial
            },
            {
                reserved: newReserved,
                available: newAvailable
            },
            {
                new:true
            }
        )
    }
    */

})

const orderDetailsModel = mongoose.model('orderDetail', orderDetailsSchema);

module.exports = {orderDetailsModel};