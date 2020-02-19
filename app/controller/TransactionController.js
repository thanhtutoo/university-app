const db = require('../config/db.config.js');
const config = require('../config/config.js');
const winston = require('../../winston/config');
const User = db.user;
const Order = db.order;
const CityCost = db.city_cost;
const Role = db.role;
const axios = require('axios');
const qs =require('qs');
const sequelize = require('sequelize');
const ResponseFormat = require('../core').ResponseFormat;
var moment = require('moment');
const getToken = require('./LoginController.js').getToken;
const getAmount = require('./OrderController.js').getAmount;
const getCategoryName = require('./OrderController.js').getCategoryName;
const { spawn } = require('child_process');
const {PythonShell}=require('python-shell');
var TransactionService = require('../services/transaction.service');
// const pythonshell = require('python-shell');
exports.updateTransaction =  async (req, res) => {
    const courier_list = await db.sequelize.query(`SELECT * FROM sys_city where is_imda=1`, {
      type: sequelize.QueryTypes.SELECT
    }).catch((err) => console.log(err));    
    
    const courier = courier_list.forEach(async courier_info => {
        // console.log(courier_info.city_name);
        const app_url =  "http://www.parcelsanta.net:1218/?charset=utf-8&name="+courier_info.city_no+"&opt=get";
        // console.log(app_url);
        const aa = await this.triggerTransaction(req, res,app_url);
      });

}    
module.exports.triggerTransaction = async (req, res,app_url) =>{
    // const app_url = "http://www.parcelsanta.net:1218/?charset=utf-8&name=IMDA&opt=get";
    let axiosConfig = {
                  rejectUnauthorized: false,
                  requestCert: true,
                  strictSSL: false,
                  agent: false,
                    headers: {
                        'Content-Type': 'application/json;charset=UTF-8',
                      
                    }
                  };
    const api_call = await axios.get(app_url,axiosConfig)
    .catch((err) => { 
      console.log(err)
      winston.error('api failed->')
      res.status(200).json(
      {'code':'0001','responsTime':moment().format(),'msg':'api failed'})
    });
    // const ps_data = "DN20190619090247186343|TestTest4|PC|deposited parcel|1560909661";
    // if(ps_data)
    // const my_data = "IMDA132761111041777692481|RETURNSZ300|RP|pending collection|1568106174";
    // console.log(api_call);
    if(api_call.data != 'HTTPSQS_GET_END' ){
        // winston.info('send_transaction_event->'+JSON.stringify(api_call.data));
      const tracking_no = await TransactionService.updateTransaction(req,res,api_call.data).catch((err) => console.log(err)); 
    }

}

// module.exports = {
//     triggerTransaction: triggerTransaction
// };