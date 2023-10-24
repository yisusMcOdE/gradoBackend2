const { mongoose } = require ('../../database/connection.js');

const roles = ['Cliente','Area','Recepcion','Direccion','Administracion','SuperUsuario']

const schema = {
    user: {type : String , unique : true, required : true},
    password : { type : String , minLength: 6, required : true },
    role : { type : String,enum:roles , required : true },
    status: {type: Boolean, default:true},}

const userSchema = new mongoose.Schema(schema,{timestamps:true, versionKey:false});

const userModel = mongoose.model('user', userSchema);

module.exports = {userModel}