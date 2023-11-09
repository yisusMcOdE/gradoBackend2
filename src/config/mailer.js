const nodemailer = require('nodemailer');
const { generateEmail } = require('../mail');
const { configServerModel } = require('./configServer');

(async()=>{
    try {
        const {emailNotification,passEmailAplication}=( await configServerModel.findOne({},'emailNotification passEmailAplication')) || {emailNotification:'',passEmailAplication:''};
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
            user: emailNotification,
            pass: passEmailAplication,
            },
        });
        
        transporter.verify().then(async()=>{
            console.log('Servicio email listo');
            await configServerModel.findOneAndUpdate({},{statusEmailNotifications:true});
        }).catch(async(err)=>{
            console.log('Servicio email inahbilitado');
            await configServerModel.findOneAndUpdate({},{statusEmailNotifications:false});
        })

        transporter.close()   
    } catch (error) {
        console.log(error)
    }
})();

const sendEmail = async (title, name, details, email) => {

    const {statusEmailNotifications, emailNotification, passEmailAplication} = await configServerModel.findOne({},'statusEmailNotifications emailNotification passEmailAplication');

    if(statusEmailNotifications){
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
            user: emailNotification,
            pass: passEmailAplication,
            },
        });

        const htmlTemplate = generateEmail('Señor', name, details);
         console.log('se envia');
        const response = await transporter.sendMail({
            from: 'Imprenta Universitaria <uatfImprenta@gmail.com>', // sender address
            to: email, // list of receivers
            subject: "Pedido Finalizado ✔", // Subject line
            html: htmlTemplate, // html body
        });

        transporter.close()
    }
}

module.exports={sendEmail}
