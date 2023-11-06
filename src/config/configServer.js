const {mongoose} = require ('../database/connection.js');

const schemaConfig = new mongoose.Schema({
    intervalBackups : {type: Number, default: 1},
    statusBackups : {type: Boolean, default:false},
    emailNotification: {type: String, default:'example@gmail.com'},
    passEmailAplication: {type: String, default:'1234567890'},
    statusEmailNotifications: {type: Boolean, default:false},
    statusWWebNotifications: {type: Boolean, default:false},
}, {timestamps:true, versionKey:false});

schemaConfig.pre('save', async(next)=>{
    console.log('realizar pre')
    const count = await configServerModel.countDocuments();
    if(count > 1){
        next(new Error('Ya existe configuraciones'))}
    else
        next()
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