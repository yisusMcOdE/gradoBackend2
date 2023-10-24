const { mongoose } = require ('../../database/connection.js');

const counterSchema = new mongoose.Schema({
    sequenceValue: Number
});
const counterModel = mongoose.model('counter', counterSchema);

const getNextSequenceValue = async () => {
    const counter = await counterModel.findOneAndUpdate(
        {},
        { $inc: { sequenceValue: 1 } },
        { new: true, upsert: true }
    );
    if(counter===null){
        const newDocument = new counterModel({sequenceValue:1});
        await newDocument.save();
        return 1
    }else{
        return counter.sequenceValue;
    }
  }

const schema = {
    idClient : {type: mongoose.Types.ObjectId, ref: 'clients' },
    client : {type : String, required : true},
    dateDelivered : Date,
    cost : {type : Number, required : true},
    status: {type: Boolean, default:true},
    statusDelivered : {type: Boolean, default:false},
    numberCheck : {type: Number, default: 0},
    numberTicketPay : Number
}

const orderExternalSchema = new mongoose.Schema(schema,{timestamps:true, versionKey:false});

const orderExternalModel = mongoose.model('orderExternal', orderExternalSchema);


module.exports = {orderExternalModel, getNextSequenceValue};