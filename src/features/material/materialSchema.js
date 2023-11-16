const {mongoose} = require ('../../database/connection.js');

const schema = {
    name: {type : String, unique : true , required : true},
    unit: {type : String, required : true},
    available: {type:Number, default:0},
    reserved: {type:Number, default:0},
    used: {type:Number, default:0},
    total : {type: Number,default:0},
    over: {type:Number, default:0},
    status: {type: Boolean, default:true}
}

const materialSchema = new mongoose.Schema(schema,{timestamps:true, versionKey:false});

materialSchema.post('findOneAndUpdate',async(doc)=>{
    try {
        const response = await materialModel.find(
            {
                _id:doc._id
            }
        );
        const total = Number(response[0].available + response[0].reserved + response[0].used).toFixed(2);
        await materialModel.updateOne({_id:doc._id},{total:total});   
    } catch (error) {
        console.log(error)
    }
})

const materialModel = mongoose.model('material', materialSchema);

module.exports = {materialModel};