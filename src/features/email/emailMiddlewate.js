const express = require('express');
const { htmlTemplate } = require('../../mail');
const nodemailer = require('nodemailer');
const { configServerModel } = require('../../config/configServer');
const { addBinnacle } = require('../binnacle/binnacleMiddleware');
const { binnacleModel } = require('../binnacle/binnacleSchema');
const { ReasonPhrases, StatusCodes } = require('http-status-codes');


const sendStatus = async (req, res) => {

    try {
        req.binnacleId = await addBinnacle(req, true);

        let serviceStatus = false;
        const {emailNotification,passEmailAplication, statusEmailNotifications} = await configServerModel.findOne({},'emailNotification passEmailAplication statusEmailNotifications');
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
            user: emailNotification,
            pass: passEmailAplication,
            },
        });
        
        await transporter.verify().then(async()=>{
            serviceStatus = true
        }).catch(async(err)=>{
            serviceStatus = false        
            await configServerModel.findOneAndUpdate({},{statusEmailNotifications:false});
        })

        transporter.close()

        const status = {
            service : serviceStatus,
            notifications : statusEmailNotifications,
            email: emailNotification
        }

        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});
        res.status(StatusCodes.OK).send(JSON.stringify(status));

    } catch (error) {
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CONFLICT});
        res.status(StatusCodes.CONFLICT).send({message: ReasonPhrases.CONFLICT});
    }

}

const updateConfigEmail = async(req, res, next) => {
    try {
        await configServerModel.findOneAndUpdate({},req.body)
        await sendStatus(req, res)
    } catch (error) {
        console.log(error)
    }
}

module.exports = {sendStatus, updateConfigEmail}