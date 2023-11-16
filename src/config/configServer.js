const {mongoose} = require ('../database/connection.js');

const schemaConfig = new mongoose.Schema({
    intervalBackups : {type: Number, default: 1},
    statusBackups : {type: Boolean, default:false},

    emailNotification: {type: String, default:'example@gmail.com'},
    passEmailAplication: {type: String, default:'1234567890'},
    statusEmailNotifications: {type: Boolean, default:false},

    statusWWebNotifications: {type: Boolean, default:false},

    chargeDirector : {type: String, default:''},
    chargeIt : {type: String, default:''},
    chargePrintingManager : {type: String, default:''},
    chargePastingManager : {type: String, default:''},
    chargeTypographyManager : {type: String, default:''},
    chargeManager : {type: String, default:''},
    chargeReception : {type: String, default:''},

    registerGet : {type: Boolean, default:false},
    registerPost : {type: Boolean, default:true},
    registerPut : {type: Boolean, default:true}
}, {timestamps:true, versionKey:false});

schemaConfig.pre('save', async(next)=>{
    try {
        const count = await configServerModel.countDocuments();
        if(count > 1){
            next(new Error('Ya existe configuraciones'))}
        else
            next()
    } catch (error) {
        console.log(error)
    }
})

const configServerModel = mongoose.model('configServer', schemaConfig);

const configServer = async(mongoose) => {
    try {
        const config = await configServerModel.find({});
        if(config.length===0){
            const configNew = new configServerModel({});
            await configNew.save()
        }
    } catch (error) {
        console.log(error)
    }
    
}

module.exports = {configServerModel, configServer}