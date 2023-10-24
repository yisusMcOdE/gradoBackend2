const mongoose = require ('mongoose');

const url = "mongodb://mongo/imprenta";

const con = async () => {
    try {
        await mongoose.connect(url);
        console.log("Base de datos conectada")
    } catch (error) {
        console.log("error en coneccion a la base de datos")
    }   
    
}

con();

module.exports = {mongoose};