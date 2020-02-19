const db = require('../config/db.config.js');
const config = require('../config/config.js');
const winston = require('../../winston/config');
const User = db.user;
const Order = db.order;
const Device = db.device;
const BookingLog = db.booking_log;
const WebhookStatus = db.webhook_status;
const CityCost = db.city_cost;
const axios = require('axios');
const qs =require('qs');
const sequelize = require('sequelize');
const ResponseFormat = require('../core').ResponseFormat;
const getAmount = require('./order.service.js').getAmount;
const getCategoryName = require('./order.service.js').getCategoryName;
const getToken = require('../controller/LoginController.js').getToken;
const moment = require('moment');
const util = require('util');

_this = this

// const updateTransaction = async function (data) {
exports.updateTransaction = async (req, res, ps_data) => {
    // winston.info('update transaction ->'+JSON.stringify(req.body));
    // return data;
    const token = await getToken();
    // console.log(data);
    const app_url = config.imda_app_url+'transaction-update/';

    const data_arr = ps_data.split("|");
    // console.log(data_arr);
    const update_webhook_status = await db.sequelize.query(`UPDATE ems_order_pushstatus SET send_to_imda="1" WHERE order_number="${data_arr[1]}" and status_code="${data_arr[2]}"`); 
    
    const order_info = await Order.findOne({
      where: {
        order_number: data_arr[1]
      }
    });

    if(order_info){
      // DD  RP XX ER
        const order_status = await this.getEventCode(data_arr[2],data_arr[1]);    
        const payload = await this.getEventPayload(data_arr[2],order_info);    
        // console.log(payload);
        const data = {
                          reference_id      : 'PS'+Math.round((new Date()).getTime() / 1000),
                          transaction_id    : order_info.dataValues.transaction_id,
                          locker_station_id : await this.checkLockerStation(order_info.dataValues.device_number),
                          transaction_events:{
					                          event_code        : order_status,
					                          event_date_time   : moment().format(),
					                          event_payload     : payload
                          					 }
                     };
        // console.log(data);
		  WebhookStatus.create({
	             reference_id  	   : data.reference_id,
	             transaction_id    : order_info.dataValues.transaction_id,
               order_number      : order_info.dataValues.order_number,
               locker_station_id : order_info.dataValues.locker_station_id,
               city_id 		       : order_info.dataValues.city_id,
               status_code 	     : order_status,
               time 			       : Math.round((new Date()).getTime() / 1000),
               ps_data 		       : ps_data,
	             data          	   : JSON.stringify(data) || '',
	             // status            : JSON.stringify(req.body) || '',
	          }).catch(err => {
	              winston.error('failed_webhook_log ->'+err)
	              res.status(422).json(ResponseFormat.error(
	                'failed_webhook_log',
	                reference_id,
	                422
	              ))
	            });
      let axiosConfig = {
					        rejectUnauthorized: false,
					        requestCert: true,
					        strictSSL: false,
					        agent: false,
					        headers: {
								        'Content-Type': 'application/json;charset=UTF-8',
								        'Authorization':' Bearer '+token.access_token
								     }
					       };
      const api_call = await axios.post(app_url,data,axiosConfig).catch((err) => { 
                        	// console.log(err.response);
                        	this.failWebhook(req,res,err.response.data);
                        });
      //success
      if(typeof api_call != "undefined"){
        // console.log(api_call.data);
    		if(api_call.data.is_request_success === true){

    			const webhook_info = await WebhookStatus.findOne({
    								    where: {
    								      reference_id: api_call.data.reference_id
    								    }
    								 });
    			const webhook_update =  await webhook_info.update({
    									    status: 'success'
    								    }).catch(err => {
    							          winston.info('failed_to_update_webhook->'+JSON.stringify(err));
    							          res.status(422).json(ResponseFormat.error(
    							          'failed_to_update_webhook',
    							          api_call.data.reference_id,
    							          422
    							          ))
    					        	    })
          console.log('status updated successfully');
          res.end();
  		  }
      }
    }else{
    	 console.log('failed');
      res.end();
    }
}

exports.failWebhook = async (req,res,err_info) =>{

	const webhook_info = await WebhookStatus.findOne({
                            where: {
                              reference_id: err_info.reference_id
                            }
        				 });
	console.log('done failed');
	const webhook_update = await webhook_info.update({
	                        status: 'failed',
	                        remark: JSON.stringify(err_info)
	                       }).catch(err => {
	                              // console.log(err);
	                              winston.info('failed_to_update_webhook->'+JSON.stringify(err));
	                              res.status(422).json(ResponseFormat.error(
	                              'failed_to_update_webhook',
	                              err_info.reference_id,
	                              422
	                              ))
	                            })
    res.end();     
}



//API 8: Update Transaction module
exports.getEventCode = async (order_status,order_number) =>{
        if(order_status == 'PC'){
          const check_locker_size = await this.checkLockerSize(order_number);
          if(check_locker_size == "Yes"){
             return event_code = 'TE009'; // deposit by lsp
           }else{
             return event_code = "TE010";
           }
        }
        else if(order_status == 'DD'){
          return event_code = 'TE014';
        }
        else if(order_status == 'XX'){
          const is_return_delivery = await this.isReturnParcel(order_number);
          if(is_return_delivery == "Yes"){
            return event_code = 'TE015';
          }else{
            return event_code = 'TE016';  
          }
        }
        else if(order_status == 'RP'){
          const check_locker_size = await this.checkLockerSize(order_number);
          if(check_locker_size == "Yes"){
             return event_code = 'TE011'; // deposit by lsp
          }else{
             return event_code = "TE012";
          }
        }
        else{
          return event_code = 'Not Valid'
        }
}

exports.isReturnParcel = async (order_number) => {
   const order_info = await Order.findOne({
                              where: {
                                order_number: order_number,
                              }
                            });
    if(order_info.dataValues.is_return_delivery == "1"){
      return "Yes";
    }else{
      return "No";
    }
}

exports.checkLockerSize = async (order_number) => {
    const city_cost_info = await CityCost.findOne({
                              where: {
                                order_number: order_number,
                                city_type:1
                              }
                            });   
    const order_info = await Order.findOne({
                              where: {
                                order_number: order_number,
                              }
                            });
    if(city_cost_info){

        if(city_cost_info.dataValues.locker_box_category == order_info.dataValues.locker_box_category){
            return "Yes";
        } else{
            return "No";
        }
    }

}
exports.checkLockerStation = async (device_number) => {

    const device = await Device.findOne({
                              where: {
                                device_number:device_number,
                              }
                            });
    return device.dataValues.locker_station_id;

}

exports.getPayload = async (order_status,order_info) => {

    const city_cost_info = await CityCost.findOne({
                              where: {
                                order_number: order_info.dataValues.order_number,
                                city_type:1
                              }
                            });
    if(city_cost_info){
        //check upgrade or not // event 10
        // console.log(order_info.dataValues.locker_box_category);
        if(city_cost_info.dataValues.locker_box_category == order_info.dataValues.locker_box_category){
            const payload = {
                                lsp_user_id : order_info.dataValues.staff_id
                             };
            return payload;
        }
        else{
            //event 10
            const amount = await getAmount(order_info.dataValues.city_id,order_info.dataValues.locker_box_category);
            if (city_cost_info) {
                city_cost_info.update({
                    debit_amount: amount,
                    remark : "###Update Locker box from "+city_cost_info.dataValues.locker_box_category+" to "+order_info.dataValues.locker_box_category
                  }).then(result => {
                          // code with result
                          // console.log(result);
                        })
                        .catch(err => {
                          // error handling
                          // console.log(err);
                        })
                }
                const get_category_name = await getCategoryName(order_info.dataValues.locker_box_category);
                const payload = {
                                locker_upgrade : true,
                                locker_box_category : get_category_name,
                                locker_box_cost : amount,
                                locker_box_cost_currency : 'SGD',
                                lsp_user_id : order_info.dataValues.staff_id,
                              };
            return payload;
              }
    }else{
      return 'there_is_no_billing';
    }
}

exports.getEventPayload = async (order_status,order_info) => {
	// console.log(order_info.dataValues);
	// console.log(order_status);
    if(order_status == 'PC'){
      // console.log(order_info.dataValues);
      const payload = await this.getPayload(order_status,order_info);          
      console.log(payload);
      console.log('PC');
      return payload;
    }
    else if(order_status == 'DD'){
      const payload = {
                        pod_data         : config.ps_url + "d/image/" + order_info.dataValues.sign_url,
                        delivery_feature : ""
                      };
      console.log('DD');
      console.log(order_info.dataValues.sign_url);
      console.log(order_info.dataValues);
      return payload;
    }
    else if(order_status == 'XX'){
      const payload = {
                        lsp_user_id : order_info.dataValues.staff_id,
                      };
      return payload;
    }    
    else if(order_status == 'RP'){
      const payload = await this.getPayload(order_status,order_info);    
      console.log('RP');      
      console.log(payload);      
      return payload;
    }
}