const { configServer, configServerModel } = require('../../config/configServer.js');
const { mongoose } = require ('../../database/connection.js');

const counterSchema = new mongoose.Schema({
    sequenceValue: Number
});
const counterModel = mongoose.model('counter', counterSchema);

const getNextSequenceValue = async () => {
    const {ticketPayCount} = await configServerModel.findOneAndUpdate(
        {},
        { $inc: { ticketPayCount: 1 } },
    );
    return ticketPayCount
  }

const schema = {
    idClient : {type: mongoose.Types.ObjectId, ref: 'clients' },
    client : {type : String, required : true},
    dateDelivered : Date,
    cost : {type : Number, required : true},
    status: {type: Boolean, default:true},
    statusDelivered : {type: Boolean, default:false},
    numberCheck : {type: Number, default: 0},
    numberTicketPay: { type : Number, unique : true },
    numberMinute: { type : Number, unique : true },
}

const orderExternalSchema = new mongoose.Schema(schema,{timestamps:true, versionKey:false});

const orderExternalModel = mongoose.model('orderExternal', orderExternalSchema);


module.exports = {orderExternalModel, getNextSequenceValue};