const db = require('../config/db.config.js');
const config = require('../config/config.js');
const winston = require('../../winston/config');
const User = db.user;
const Order = db.order;
const OrderCancel = db.order_cancel;
const RequestLog = db.request_log;
const Booking_Failed = db.booking_failed_log;
const Role = db.role;
const CityCost = db.city_cost;
const BookingLog = db.booking_log;
const axios = require('axios');
const qs =require('qs');
const sequelize = require('sequelize');
const ResponseFormat = require('../core').ResponseFormat;
const getToken = require('./LoginController.js').getToken;
var moment = require('moment');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
var OrderService = require('../services/order.service');

// const exec = require('child_process').exec;

// import sequelize from 'sequelize'
//conversion reservation to booking
module.exports.webhook = async function(req, res, next){
      winston.info('sms->'+JSON.stringify(req.body));
      return res.status(200).json('good'); 
}

async function get_access_key(consumer_access_key,locker_info,tracking_no,lsp_id){
      const client_secret = config.client_secret;
      if(consumer_access_key){
          const { stdout, stderr } = await exec('python3 crypto.py encrypt '+ client_secret +' '+consumer_access_key).catch((err) => {
                  winston.error('failed_encryption_password ->'+err);
                  res.status(422).json(ResponseFormat.error(
                    'failed_encryption_password',
                    "PSCB"+moment().unix(),
                    422
                  ));
                });

          if (stderr) {
            res.status(422).json(ResponseFormat.validation_error(
                    "PSCB"+moment().unix(),
                    422,
                    'Encryption password fail!'
                  ))
          }
      const params = {
                    consumer_access_key:stdout,
                    // consumer_access_key:"jA0ECQMCyTznX8ziRXn/0j0B3RlazxkzOsfVfGVH/XIY3dW2JhsKSIkjucMuKme5JQLbiZlmOTtug4XNksoWSgBWgLg3NYm0CHVz04Od12",
                    reference_id:"PSCB"+moment().unix(),
                    locker_station_id:locker_info.locker_station_id
                  }
      return params;
    }else{
      const params = {
                    reference_id :"PSCB"+moment().unix(),
                    locker_station_id:locker_info.locker_station_id,
                    tracking_no:tracking_no,
                    lsp_id:lsp_id
                  }
      return params;
    }
}

module.exports.convertBooking = async function(req, res, next){

    const booking_log = await RequestLog.create({
     reference_id  : req.body.reference_id || "PSCB"+moment().unix(),
     data          : JSON.stringify(req.body) || '',
     remark        : 'convert_booking',
     create_time   : Math.round((new Date()).getTime() / 1000)
    }).catch(err => {
      winston.error('failed_convert_booking_log ->'+err)
      res.status(422).json(ResponseFormat.error(
        'convert_booking_log_error',
        reference_id,
        422
      ))
    });

    const app_url = config.imda_app_url+'locker-access/reservation-query/';
    const token = await getToken();
    const device_number =  req.body.device_number || '';
    const tracking_no =  req.body.order_number || 'returntest1';
    const lsp_id =  req.body.lsp_id || '278dec06-70b6-429d-a4b5-03b34db4241b';
    const reference_id =  req.body.reference_id || "PSCB"+moment().unix();
    const client_secret = config.client_secret;
    // const transaction_id ='39aa234e-48ff-4c1b-9708-7e62ffda4ac2';

    const locker_info = await db.sequelize.query(`SELECT * FROM ems_device where device_number="${device_number}"`, {
        plain: true,
        type: sequelize.QueryTypes.SELECT
    }).catch(err => {
            winston.error('No Locker station ->'+err)
            res.status(422).json(ResponseFormat.error(
            'locker_station_not_found',
            reference_id,
            422
          ))
    });  
    var params =  await get_access_key(req.body.consumer_access_key,locker_info,tracking_no,lsp_id); 
    let axiosConfig = {
      rejectUnauthorized: false,
      requestCert: true,
      strictSSL: false,
      agent: false,
        headers: {
            'Content-Type': 'application/json;charset=UTF-8',
            'Authorization':' Bearer '+token.access_token
          
        },
        params // consumer_access_key  
      };

    const api_call = await axios.get(app_url,axiosConfig)
     .catch((err) => { 
        console.log(err.response)
        winston.error('failed_convertbooking->'+err.response.data.error_message)
        winston.error('test->'+err.response.data.error_details)

      return res.status(422).json(ResponseFormat.pserror(
        err.response.data.error_message
        ))
    });
 
    if(typeof api_call.data != "undefined"){

      if(api_call.data.is_request_success == true){
        // console.log(api_call);
        const transaction_id = api_call.data.transaction_id;
        console.log(transaction_id);
        do {
              const get_booking = await OrderService.getBooking(req,res,transaction_id).catch(err => { console.log(err) });
              if (get_booking == 'not_exist') {
                  $error_no = 1062;
              } else {
                 const data = {reference_id:reference_id,transaction_id:transaction_id};
                 console.log(get_booking);
                return res.status(200).json(get_booking); 
              }
        } while ($error_no == 1062); //如果是订单号重复则重新提交数据

      }else{
        console.log('not_success_api_call');
        res.status(422).json(ResponseFormat.error(
        'not_success_api_call',
        'PSOffice',
        422
        ))
      }
    }
  
}


exports.cancelBooking = async function(req, res, next){
    winston.info('Booking_cancel->'+JSON.stringify(req.body));

    const transaction_id = req.body.transaction_id ||'';
    const reference_id = req.body.reference_id ||'';
    const is_consumer_return_abort = req.body.is_consumer_return_abort ||0;
    const cancellation_reason = req.body.cancellation_reason ||0;

    const booking_log = await RequestLog.create({
      reference_id  : req.body.reference_id || '',
      data          : JSON.stringify(req.body) || '',
      remark        : 'cancel_booking',
      create_time   : Math.round((new Date()).getTime() / 1000)
    }).catch(err => {
      winston.error('failed_request_log ->'+err)
      res.status(422).json(ResponseFormat.error(
        'request_log_error',
        reference_id,
        422
      ))
    });

    if(transaction_id===""){
      const data = {'transaction_id':'transaction_id_should_not_be_null'};
      res.status(422).json(ResponseFormat.validation_error(
        reference_id,
        422,
        data
      ))
    }
    else{
      const order_no = await Order.findOne({
        where: {
          transaction_id: transaction_id
        }
      });
      if (order_no != null) {
        // console.log(order_no.dataValues.order_status);
        if (order_no.dataValues.order_status == '1') {
          res.status(422).json(ResponseFormat.error(
          'parcel_deposited!',
          reference_id,
          422
          ))
        }
        else if (order_no.dataValues.order_status == '20') {
          res.status(422).json(ResponseFormat.error(
          'already_canceled',
          reference_id,
          422
          ))
        }        
        else if(order_no.dataValues.order_status == '2'){
          res.status(422).json(ResponseFormat.error(
          'parcel_collected',
          reference_id,
          422
          ))
        }        
        else if(order_no.dataValues.order_status == '6'){
          res.status(422).json(ResponseFormat.error(
          'parcel_retrieved_by_driver',
          reference_id,
          422
          ))
        }        
        else if(order_no.dataValues.order_status == '7'){
          res.status(422).json(ResponseFormat.error(
          'parcel_returned_by_customer',
          reference_id,
          422
          ))
        }
        else{
          const order_update = await order_no.update({
            order_status: 20
          }).catch(err => {
            winston.info('Booking_cancel->'+JSON.stringify(err));
            res.status(422).json(ResponseFormat.error(
            'failed_to_cancel_booking',
            reference_id,
            422
            ))
          })
          
          if (order_update.dataValues) {

              const booking_log = await OrderCancel.create({
                 order_id                 : order_no.dataValues.order_id,
                 reference_id             : req.body.reference_id || '',
                 transaction_id           : order_no.dataValues.transaction_id,
                 is_consumer_return_abort : req.body.is_consumer_return_abort ||'',
                 cancellation_reason      : req.body.cancellation_reason,
                 created_at              : Math.round((new Date()).getTime() / 1000)
              }).catch(err => {
                winston.error('failed_booking_log ->'+err)
                res.status(422).json(ResponseFormat.error(
                  'booking_log_error',
                  reference_id,
                  422
                ))
              });

              if (is_consumer_return_abort == '1') { 
                const update_cost = CityCost.update({
                  update_desc: 'cancel reason: '+cancellation_reason,
                  debit_amount: 0},
                  {returning: true, where: {order_id:order_no.dataValues.order_id} 
                }).catch(err => {
                  winston.info('Booking_cancel->'+JSON.stringify(err));
                  res.status(422).json(ResponseFormat.error(
                  'failed_to_cancel_booking',
                  reference_id,
                  422
                  ))
                })        
              }

              Order.destroy({
                  where: {
                      transaction_id:transaction_id
                  }
              });

              const update_token = await db.sequelize.query(`UPDATE ems_drawer_resource_info SET drawer_status="0" WHERE device_number ="${order_no.dataValues.device_number}" and drawer_number="${order_no.dataValues.drawer_number}"`);
              const data = {reference_id:reference_id,transaction_id:transaction_id};
              res.status(200).json(ResponseFormat.build(data,'booking_cancel_successfully',200,))
          
          } else {
              res.status(422).json(ResponseFormat.error(
              'failed_to_cancel_booking',
              reference_id,
              422
              ))
          }
        }
      }
      else{
        res.status(422).json(ResponseFormat.error(
        'transaction_not_found',
        reference_id,
        422
        ))
      }
    }
}

async function makePwd(length){
   var result           = '';
   var characters       = '0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

//booking module
exports.createBooking = async (req, res,next)=>{
  // Save Order to Database

  winston.info('Booking_request->'+JSON.stringify(req.body));

  const business_code = 'IMDA' +  Date.parse('2012-01-26T13:51:50.417-07:00') + Math.floor(Math.random() * 9999999) + 1;
  const locker_station_id = req.body.locker_station_id || '';
  const reference_id = req.body.reference_id || '';
  const transaction_id = req.body.transaction_id ||'';
  const tracking_number = req.body.tracking_no || '';
  const lsp_id = req.body.lsp_id || '';
  const consumer_access_key = req.body.consumer_access_key || '';
  const client_secret = config.client_secret;

  const booking_log = await RequestLog.create({
    reference_id  : req.body.reference_id || '',
    data          : JSON.stringify(req.body) || '',
    remark        : 'create_booking',
    create_time   : Math.round((new Date()).getTime() / 1000)
  }).catch(err => {
    winston.error('failed_booking_log ->'+err)
    res.status(422).json(ResponseFormat.error(
      'booking_log_error',
      reference_id,
      422
    ))
  });
  //off for a while for password  
  const { stdout, stderr } = await exec('python3 crypto.py edecrypt '+ client_secret +' '+ consumer_access_key).catch((err) => {
    winston.error('failed_encryption_password ->'+err);
    res.status(422).json(ResponseFormat.error(
      'failed_encryption_password',
      reference_id,
      422
    ));
  });

  if (stderr) {
    res.status(422).json(ResponseFormat.validation_error(reference_id,422,'Encryption password fail!'));
  }
  const password = stdout;
  // const password = await makePwd(8);
  // console.log(password);
  const city = await db.sequelize.query(`SELECT * FROM sys_city where city_id="${lsp_id}"`, {
    plain: true,
    type: sequelize.QueryTypes.SELECT
  }).catch((err) => {
    winston.error('failed_lsp_id_not_exist ->'+err)
    OrderService.failBooking(req,res,'failed_lsp_id_not_exist');                
  });   //courier company

  const tracking_no = await OrderService.getTrackingNumber(tracking_number).catch((err) => {
    winston.error('failed_getTrackingNo ->'+err);
    OrderService.failBooking(req,res,'failed_getTrackingNo'); 
  });

  const lockerBoxStatus = await OrderService.getLockerboxCategory(req, res).catch((err) => {
    winston.error('failed_getLockerboxCategory ->'+err)
    OrderService.failBooking(req,res,'failed_getLockerboxCategory'); 
  }); // you need to know the status of this method, go and check getLockerboxCategory
       
  // the stream will output the JSON if you reach the else branch, but make no mistake, the javascript is not done, the following lines will be evaluated.
  if(lockerBoxStatus){

  const locker_info = await db.sequelize.query(`SELECT * FROM ems_device where locker_station_id="${locker_station_id}"`, {
    plain: true,
    type: sequelize.QueryTypes.SELECT
  }).catch((err) => {
    winston.error('failed_locker_info ->'+err);
    OrderService.failBooking(req,res,'failed_locker_info'); 
  });

  if(locker_info){

        const locker_drawer_resource =  await OrderService.getDrawerResourceInfo(locker_info,req.locker_box_category).catch((err) => {
          winston.error('failed_locker_drawer_resource ->'+err)
          OrderService.failBooking(req,res,'failed_locker_drawer_resource'); 
        });
        if (locker_info.status == 0) {
          OrderService.failBooking(req,res,'locker_station_offline'); 
          res.status(422).json(ResponseFormat.error(
            'locker_station_offline',
            reference_id,
            422
          ))
        }
        else if (locker_drawer_resource == "insufficient_capacity") { // if this is 0, then you will not get a write error, because getLockerboxCategory will close the stream.
          OrderService.failBooking(req,res,'insufficient_capacity'); 
          res.status(422).json(ResponseFormat.error(
            'insufficient_capacity',
            reference_id,
            422
          ))
        }
        else if (tracking_no ==='should_not_null'){
          const data = {'tracking_no':'tracking_no shoud not be null'};
          OrderService.failBooking(req,res,'tracking_no_null'); 
          res.status(422).json(ResponseFormat.validation_error(
            reference_id,
            422,
            data
          ))
        }        
        else if (!city){
          const data = {'lsp_id':'lsp_id is not created'};
          OrderService.failBooking(req,res,'failed_lsp_id_not_created'); 
          res.status(422).json(ResponseFormat.validation_error(
            reference_id,
            422,
            data
          ))
        }
        else if (transaction_id == ''){
          OrderService.failBooking(req,res,'transaction_id_should_not_be_null'); 
          const data = {'transaction_id':'transaction_id shoud not be null'};
          res.status(422).json(ResponseFormat.validation_error(
            reference_id,
            422,
            data
          ))
        }              
        else if(tracking_no.order_id){
          OrderService.failBooking(req,res,'tracking_number_already_exist'); 
          const data = {'tracking_no':'tracking_number_already_exist'};
            res.status(422).json(ResponseFormat.validation_error(
              reference_id,
              422,
              data
            ))
        }        
        else if (locker_info.status == 2) {
          OrderService.failBooking(req,res,'locker_station_retired'); 
          res.status(422).json(ResponseFormat.error(
            'locker_station_retired',
            reference_id,
            422
          ))
        }
        else{

            const locker_create = await locker_info;
              if(typeof locker_create !== 'undefined'){
                if(typeof req.locker_box_category !== 'undefined'){
                  const drawer_number = await OrderService.getDrawer(locker_info.device_number,req.locker_box_category);
                  if(drawer_number != "insufficient_capacity"){
                     const zip_code_array = locker_info.zip_code.split("#");
                     const order_create = await Order.create({
                     order_number                : req.body.tracking_no || '',
                     receiver_name               : req.body.receiver_name || '',
                     receiver_phone              : req.body.notification_mobile,
                     receiver_password           : parseInt(password),
                     dw_price                    : req.body.dw_price || 0,
                     currency                    : req.body.payment_currency||'',
                     pay_type                    : req.body.pay_type || 0,
                     pay_status                  : 0,
                     business_code               : business_code,
                     quick_reference             : '',
                     e_orderid                   : '',
                     enterprise_number           : '',
                     device_number               : locker_info.device_number,
                     drawer_number               : drawer_number,
                     email                       : req.body.notification_email || '',
                     city_id                     : req.body.lsp_id,
                     zip_code                    : zip_code_array[0],
                     staff_id                    : req.body.lsp_user_id,
                     order_status                : 0,
                     order_time                  : Math.round((new Date()).getTime() / 1000),
                     over_time                   : Math.round((new Date()).getTime() / 1000) + 172800,
                     pickup_type                 : 1,
                     order_type                  : 1,
                     enterprise_number           : req.body.lsp_id,
                     plat_ent_no                 : req.body.lsp_id,
                     length                      : req.parcel_length,
                     height                      : req.parcel_height,
                     width                       : req.parcel_width,
                     item_desc                   : req.body.item_desc || '',
                     reference_id                : req.body.reference_id || '',
                     requestor_key               : req.body.requestor_key || '',
                     transaction_id              : req.body.transaction_id || '',
                     lsp_id                      : req.body.lsp_id || '',
                     content_scanned_status      : req.body.content_scanned_status || 0,
                     content_scanned_description : req.body.content_scanned_description || '',
                     content_description         : req.body.content_description || '',
                     payment_required            : req.body.payment_required || 0,
                     payment_amount              : req.body.payment_amount || 0,
                     payment_currency            : req.body.payment_currency || '',
                     delivery_feature_required   : JSON.stringify(req.body.delivery_feature_required)|| '',
                     Send_access_key_to_lsp      : req.body.Send_access_key_to_lsp || 0,
                     is_return_delivery          : req.body.is_return_delivery || 0,
                     locker_station_id           : req.body.locker_station_id || '',
                     locker_box_category         : req.locker_box_category,
                     locker_box_cost             : '0'.concat(req.locker_box_cost),
                     locker_box_cost_currency    : "SGD",
                     is_book                     : 1,
                     is_imda                     : 1
                    }).catch(err => {
                      winston.error('failed_booking_create ->'+err)
                      OrderService.failBooking(req,res,'failed_booking_create'); 
                      res.status(422).json(ResponseFormat.error(
                        'failed_booking_create',
                        reference_id,
                        422
                      ))
                    })
                    if(order_create){

                      OrderService.createDrawerLog(order_create);
                      
                      OrderService.createBookingLog(order_create);
              
                      OrderService.createCost(order_create.order_number); 

                      const get_category_name = await OrderService.getCategoryName(order_create.locker_box_category).catch(err => {
                                                winston.error('failed_get_category_name ->'+err);
                                                });
                      const data = {"reference_id":order_create.reference_id,'locker_station_id':order_create.locker_station_id,
                                    'locker_box_category':get_category_name,'locker_box_cost':order_create.locker_box_cost,'locker_box_cost_currency':order_create.locker_box_cost_currency}
                      // res.send("Booking created successfully!");
                      res.status(200).json(ResponseFormat.build(
                      data,
                      'booking created successfully',
                      200,
                      ))
                    }else{
                      OrderService.failBooking(req,res,'booking_failed'); 
                      res.status(422).json(ResponseFormat.error(
                        'booking_failed',
                        reference_id,
                        422
                      ))
                    }
                  }else{
                      OrderService.failBooking(req,res,'insufficient_capacity');  
                      res.status(422).json(ResponseFormat.error(
                        'insufficient_capacity',
                        reference_id,
                        422
                      ))
                  }
                }
            }
        } 
  }else{
    OrderService.failBooking(req,res,'locker_station_not_found'); 
    res.status(422).json(ResponseFormat.error( 'locker_station_not_found',reference_id,422));
  }
 }
}
