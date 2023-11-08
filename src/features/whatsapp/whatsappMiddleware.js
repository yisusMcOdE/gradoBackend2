const { myClient } = require("./whatsappRoute");

const getQrClient = async(req,res,next)=> {

    let qr = await new Promise((resolve, reject) => {
        myClient.on('qr', (qr) => {
            resolve(qr)
        })
    })
    res.send(JSON.stringify(qr));
   
}

const getStatusClientWhatsapp = async(req, res, next) => {
    

}

module.exports={getQrClient, getStatusClientWhatsapp}