const express = require('express');
const { Client, NoAuth, LocalAuth } = require('whatsapp-web.js');

let notifications = true;
let isWhatsappAuthenticated = false;
let maxQrError = false;

const myClient = new Client({
    authStrategy: new NoAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
    qrMaxRetries:2
});

myClient.on('ready',async()=>{
    console.log('Cliente listo desde home');
    maxQrError = false;
    isWhatsappAuthenticated = true;
})

myClient.on('disconnected',(reason)=>{
    console.log('desconectado');
    maxQrError = true
    console.log(reason);
    isWhatsappAuthenticated = false;
})

myClient.on('qr', (qr) => {
        console.log(qr);
})

myClient.on('auth_failure',(msg)=>{
    console.log('auth_fail')
    console.log(msg);
})

myClient.initialize();



const getQrClient = async(req,res,next)=> {
    try {
        if(maxQrError === true){
            myClient.initialize();
            console.log('newInitializacion');
            maxQrError = false;
        }
        let qr = await new Promise((resolve, reject) => {
            myClient.once('qr', async (qr) => {
                    resolve(qr)
                
            })
        })
        res.send(JSON.stringify(qr));
    } catch (error) {
        console.log(error)
    }
    
}

const getQrClientAuto = async (req, res , next) => {
    try {
        let qr = await new Promise((resolve, reject) => {
            myClient.once('qr', async(qr) => {
                    resolve(qr)
                
            })
        })
        res.send(JSON.stringify(qr));
    } catch (error) {
        console.log(error);
    }
    
}

const getStatusClientWhatsapp = async(req, res, next) => {
    try {
        if(isWhatsappAuthenticated === true)
            res.send(JSON.stringify({whatsapp:true, notifications, wid:myClient.info.wid.user, platform: myClient.info.platform}));
        else
            res.send(JSON.stringify({whatsapp:false}));
    } catch (error) {
        console.log(error);
    }
    
}

const getIsReady = async (req,res,next) => {

    try {
        await new Promise((resolve, reject)=>{
            myClient.once('ready',()=>{
                console.log('Cliente listo');
                isWhatsappAuthenticated = true;
                resolve(true);
            })
        })
        ///sendMessage();
        res.send(JSON.stringify({whatsapp:true, notifications, wid:myClient.info.wid.user, platform: myClient.info.platform}));
    } catch (error) {
        console.log(error)
    }
    

}

const logoutSession = async (req, res, next) => {
    try {
        await myClient.logout();
        myClient.initialize();
        isWhatsappAuthenticated = false
        res.send({})
    } catch (error) {
        console.log(error)
    }
}

const updateNotifications = async (req,res,next) => {
    try {
        notifications = req.body.notifications;
        res.send({})
    } catch (error) {
        console.log(error)
    }
}

const sendMessage = async (number, nameClient, details) => {
    let detailsFormat = '';
    details.map(item => {
        detailsFormat += `${item}\n`
    })
    const msg=`${nameClient}. \n Le informamos que su pedido esta listo para que usted pase a recepcionarlo en oficinas de la imprenta universitaria.\n *Detalle de pedido:*\n ${detailsFormat}`;
    console.log(number,'number')
    if(notifications===true){
        myClient.sendMessage(number, msg)
        .then(() => {
            console.log('Mensaje enviado con éxito');
        })
        .catch((error) => {
            console.error('Error al enviar mensaje:', error);
        })
    }
}



const whatsappRoute = express.Router();


whatsappRoute.get('/qr', getQrClient);
whatsappRoute.get('/qrAuto', getQrClientAuto);
whatsappRoute.get('/status', getStatusClientWhatsapp);
whatsappRoute.get('/ready', getIsReady);
whatsappRoute.put('/logout', logoutSession);
whatsappRoute.put('/notifications', updateNotifications);





module.exports = {whatsappRoute, myClient, sendMessage};

