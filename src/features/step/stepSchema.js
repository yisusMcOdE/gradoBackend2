const { default: mongoose } = require("mongoose")

const types = [
    'registered', 
    'confirmation', 
    'scheduled',
    'delayed',
    'develop',
    'resumed',
    'finished'
]

const schema = {
    idOrderDetail:{ type: mongoose.Types.ObjectId, ref: 'orderDetails' },
    type: {
        type: String,
        enum: types,
        required: true
    },
    description: {type : String, required : true},
    dayDelay: Number,
    startedAt:Date,
    finishedAt: Date
}

const stepSchema = new mongoose.Schema(schema,{timestamps:true, versionKey:false});

const stepModel = mongoose.model('step', stepSchema);

module.exports = {stepModel}