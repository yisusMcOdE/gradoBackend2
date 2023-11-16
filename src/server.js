const express = require('express');
const bodyParser = require('body-parser');
const { employeeRoute } = require ('./features/employee/employeeRoute.js');
const { clientInternalRoute } = require('./features/clientInternal/clientInternalRoute.js');
const { jobRoute } = require('./features/job/jobRoute.js');
const { loginRoute } = require('./features/login/loginRoute.js');
const { orderExternalRoute } = require('./features/orderExternal/orderExternalRoute.js');
const { materialRoute } = require('./features/material/materialRoute.js');
const { clientExternalRoute } = require('./features/clientExternal/clientExternalRoute');
const { orderInternalRoute } = require('./features/orderInternal.js/orderInternalRoute.js');
const { generatePdf } = require('./pdfmaker/materialsOrder.js');
const { stepRoute } = require('./features/step/stepRouter.js');
const { backupTask } = require('./schedules/backUp.js');
const { backUpConfigRoute } = require('./database/schemas/backupConfigRoute.js');
const { ordersRoute } = require('./features/orders/ordersRoute.js');
const { orderDetailsRoute } = require('./features/orderDetails/orderDetailsRouter.js');
const { scheduledRoute } = require('./schedules/schedule.js');
const { binnacleRoute } = require('./features/binnacle/binnacleRoute.js');
const { equipmentRoute } = require('./features/equipment/equipmentRoute.js');
const { reportRoute } = require('./features/report/reportsRoute.js');
const { addBinnacle } = require('./features/binnacle/binnacleMiddleware.js');
const { clientsRoute } = require('./features/clients/clientsRoute.js');
const { usersRoute } = require('./features/users/usersRoute.js');
const {whatsappRoute} = require('./features/whatsapp/whatsappRoute.js');
const { Client } = require('whatsapp-web.js');
const { emailRoute } = require('./features/email/emailRoute.js');
const { configServer, configServerModel } = require('./config/configServer.js');
const { chargesRoute } = require('./features/charges/chargesRoute.js');

const app = express();

configServer().then(()=>{
    app.listen(3000, async()=>{
        console.log("Servidor corriendo en el puerto 3000");
    });

    app.use(async(req,res,next)=>{
        res.set("Access-Control-AlloW-Origin","*");
        res.set("Access-Control-AlloW-Headers","*");
        res.set("Access-Control-AlloW-Methods","*");
        
        next()
    })
    
    ///Control de token
    
    app.use((req, res, next)=>{
        req.originalUrl=req.path;
        ///console.log(req.headers.authorization);
        res.set ({'Content-type':'application/json'});
        next()
    })
    
    
    
    
    /// Registro para bitácora
    
    app.use(bodyParser.json());
    
    
    app.use('/api/material', materialRoute);
    app.use('/api/employee', employeeRoute);
    app.use('/api/clientInternal', clientInternalRoute);
    app.use('/api/clientExternal', clientExternalRoute);
    app.use('/api/users', usersRoute);
    app.use('/api/job', jobRoute);
    app.use('/api/login', loginRoute);
    app.use('/api/orderExternal', orderExternalRoute);
    app.use('/api/orderInternal', orderInternalRoute);
    app.use('/api/step', stepRoute);
    app.use('/api/configBackup', backUpConfigRoute);
    app.use('/api/schedule', scheduledRoute);
    app.use('/api/clients', clientsRoute);
    app.use('/api/orders', ordersRoute);
    app.use('/api/orderDetails', orderDetailsRoute);
    app.use('/api/binnacle', binnacleRoute);
    app.use('/api/equipment', equipmentRoute);
    app.use('/api/reports', reportRoute);
    app.use('/api/whatsapp', whatsappRoute);
    app.use('/api/email', emailRoute);
    app.use('/api/charges', chargesRoute);
    
    app.get('/pdf', generatePdf);
    
    backupTask();
    

}).catch((error) => {
    console.error('Error en la configuración inicial:', error);
  });


module.exports={}
