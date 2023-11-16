const express = require('express');
const { htmlTemplate } = require('../../mail');
const nodemailer = require('nodemailer');
const { configServerModel } = require('../../config/configServer');
const { addBinnacle } = require('../binnacle/binnacleMiddleware');
const { binnacleModel } = require('../binnacle/binnacleSchema');
const { ReasonPhrases, StatusCodes } = require('http-status-codes');


const getCharges = async (req, res) => {

    try {
        req.binnacleId = await addBinnacle(req, true);

        const response = await configServerModel.findOne({},'chargeDirector chargeIt chargePrintingManager chargePastingManager chargeTypographyManager chargeManager chargeReception ');
        res.status(StatusCodes.OK).send(JSON.stringify(response));

    } catch (error) {
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CONFLICT});
        res.status(StatusCodes.CONFLICT).send({message: ReasonPhrases.CONFLICT});
    }

}

const updateCharges = async(req, res, next) => {
    try {
        req.binnacleId = await addBinnacle(req, true);

        await configServerModel.findOneAndUpdate({},req.body);

        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.OK});

        res.status(StatusCodes.OK).send(JSON.stringify({}));

    } catch (error) {
        if(req.binnacleId!==-1)
            await binnacleModel.findOneAndUpdate({_id:req.binnacleId},{successful:ReasonPhrases.CONFLICT});
        res.status(StatusCodes.CONFLICT).send({message: ReasonPhrases.CONFLICT});
        console.log(error)
    }
}

module.exports = {getCharges, updateCharges}