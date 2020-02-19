const db = require('../config/db.config.js');
const config = require('../config/config.js');
const Logger = require('../../winston/config');
const User = db.user;
const Order = db.order;
const BookingLog = db.booking_log;
const DrawerLog = db.drawer_log;
const Booking_Failed = db.booking_failed_log;
const Role = db.role;
const CityCost = db.city_cost;
const axios = require('axios');
const qs =require('qs');
const sequelize = require('sequelize');
const ResponseFormat = require('../core').ResponseFormat;
const getToken = require('../controller/LoginController.js').getToken;
const moment = require('moment');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

_this = this

exports.failBooking =  async (req,res,remark) => {

  Booking_Failed.create({
    reference_id  : req.body.reference_id || '',
    data          : JSON.stringify(req.body) || '',
    create_time   : Math.round((new Date()).getTime() / 1000),
    remark        : remark
  }).catch((err) => {                
    Logger.error(remark + err)
  });
}

exports.getDrawer =  async (device_number,locker_box_category) => {
// const getDrawer = async function (device_number,locker_box_category) {
  const drawer_info = await db.sequelize.query(`SELECT * FROM ems_drawer_resource_info where device_number="${device_number}" and drawer_lock=0 and drawer_status=0 and drawer_style="${locker_box_category}"`, {
      type: sequelize.QueryTypes.SELECT
    }).catch(err => {
                  Logger.error('Fail drawer ->'+err)
                  res.status(500).send("Fail! Drawer Error ->" + err);
                });

  if(drawer_info.length != 0){
      console.log(drawer_info);
  console.log(drawer_info[0].drawer_number);
    const update_drawer =  await db.sequelize.query(`UPDATE ems_drawer_resource_info SET drawer_status ="20" WHERE device_number ="${device_number}" and drawer_number="${drawer_info[0].drawer_number}"`);
    return drawer_info[0].drawer_number;
  }else{
    return "insufficient_capacity";
  }
}

module.exports.createDrawerLog = async (order_info) =>{

  DrawerLog.create({
    device_number   : order_info.device_number || '111',
    drawer_number   : order_info.drawer_number || '',
    order_number    : order_info.order_number || '',
    receiver_phone  : order_info.receiver_phone || '',
    oper_type       : 20,
    oper_time       : Math.round((new Date()).getTime() / 1000),
    city_id         : order_info.lsp_id || '',   
    remark          : 'LSP :' + order_info.lsp_id + ' booked '+ order_info.order_number+' on '+moment().format('lll')|| '',   
  }).catch(err => { Logger.error('failed_drawer_log_create ->'+ err)});
     
}

module.exports.createBookingLog = async (order_info) =>{

  BookingLog.create({
    order_number      : order_info.order_number || '111',
    reference_id      : order_info.reference_id || '',
    transaction_id    : order_info.transaction_id || '',
    locker_station_id : order_info.locker_station_id || '',
    lsp_id            : order_info.lsp_id || 0,
    time              : Math.round((new Date()).getTime() / 1000),
    data              : '' || '',   
  }).catch(err => { Logger.error('failed_booking_log_create ->'+ err)});
     
}

module.exports.createCost = async (order_number) =>{

    const order_no = await Order.findOne({
      where: {
        order_number: order_number
      }
    })
    if(order_no){

      const amount1 = await this.getAmount(order_no.dataValues.city_id,order_no.dataValues.locker_box_category);
      if(amount1 != 'lsp_is_not_created'){
        const amount2 = '0.10';//给小区提成快递公司费用
        const data = [
                      {
                       order_id         : order_no.dataValues.order_id || '',
                       order_number     : order_no.dataValues.order_number || '',
                       city_id          : order_no.dataValues.city_id || '',
                       city_type        : 1,
                       cost_type        : 'NF',
                       debit_amount     : amount1,
                       credit_amount    : 0,
                       add_time         : Math.round((new Date()).getTime() / 1000),
                       update_time      : 0,
                       change_desc      : '###Booking Parcel:' + order_no.dataValues.order_number + 'deposited success，cost courier company:'+ amount1,
                       cost_status      : '1',
                       operator_id      : 0,
                       drawer_number    : order_no.dataValues.drawer_number,
                       locker_box_category    : order_no.dataValues.locker_box_category
                      },
                      {
                       order_id         : order_no.dataValues.order_id || '',
                       order_number     : order_no.dataValues.order_number || '',
                       city_id          : order_no.dataValues.city_id || '',
                       city_type        : 2,
                       cost_type        : 'NF',
                       debit_amount     : amount2,
                       credit_amount    : 0,
                       add_time         : Math.round((new Date()).getTime() / 1000),
                       update_time      : 0,
                       change_desc      : '###Booking Parcel:' + order_no.dataValues.order_number + 'deposited success，cost condo:'+ amount2,
                       cost_status      : '1',
                       operator_id      : 0,
                       drawer_number    : order_no.dataValues.drawer_number,
                       locker_box_category    : order_no.dataValues.locker_box_category
                      }            
                     ];

        CityCost.bulkCreate(data, {returning: true}).catch(err => {Logger.error('failed_city_cost ->'+err)})
      }else{
        // console.log('yeah2');
        return "lsp_is_not_created";
      }
    }
}

module.exports.getAmount = async (city_id,locker_box_category) => {
      const city = await db.sequelize.query(`SELECT * FROM sys_city where city_id="${city_id}"`, {
                   plain: true,
                   type: sequelize.QueryTypes.SELECT
                   }).catch((err) => console.log(err));   //courier company
      // const city1 = await db.sequelize.query(`SELECT * FROM sys_city where city_id="${city_id1}"`, {
      //              plain: true,
      //              type: sequelize.QueryTypes.SELECT
      //              }).catch((err) => console.log(err)); //condo

      if(city){
          const price = await db.sequelize.query(`SELECT * FROM ems_drawer_price where id="${city.price_temp_id}"`, {
                   plain: true,
                   type: sequelize.QueryTypes.SELECT
                   }).catch((err) => console.log(err));
          // const price1 = await db.sequelize.query(`SELECT * FROM ems_drawer_price where id="${city1.price_temp_id}"`, {
          //               plain: true,
          //               type: sequelize.QueryTypes.SELECT
          //               }).catch((err) => console.log(err));
          // console.log(pr)
          if (locker_box_category == 1) {
              const amount1 =  price.city_nf_price;//收快递公司费用
              return amount1;
          } 
          else if (locker_box_category == 2) {
              const amount1 =  price.city_nf_price2;//收快递公司费用
              return amount1;
          } 
          else if (locker_box_category == 3) {
              const amount1 =  price.city_nf_price3;//收快递公司费用
              return amount1;
          }
        }else{
            return "lsp_is_not_created";
        }
    
            
}


exports.getLockerboxCategory = async (req, res)=> {
  // console.log(req.body.parcel_length);
  let status = 1; // assuming 1 by default
 

  if (req.body.locker_box_category == 'S') {
    // small box
    req.locker_box_category = 3;
    req.locker_box_cost = await this.getAmount(req.body.lsp_id,3);

    // req.locker_box_cost = 1;
  } else if (req.body.locker_box_category == 'M') {
    //medium box
    req.locker_box_category = 2;
    req.locker_box_cost = await this.getAmount(req.body.lsp_id,2);
  } else if (req.body.locker_box_category == 'L') {
    //large box
    req.locker_box_category = 1;
    // req.locker_box_cost = 2;
    req.locker_box_cost = await this.getAmount(req.body.lsp_id,1);
  } else {

    status = 0;
    // is_sufficient_capacity = 0;
    res.status(422).json(ResponseFormat.error(
      'parcel_is_too_large',
      req.body.reference_id,
      422 
    ))
    // res.end(); // you don't need this `.json` will output+end the stream

  }
  return status;
}
exports.getLockerboxCategorybydimention = async (req, res)=> {
  // console.log(req.body.parcel_length);
  let status = 1; // assuming 1 by default
  req.parcel_length = req.body.parcel_length || 0;
  req.parcel_height = req.body.parcel_height || 0;
  req.parcel_width = req.body.parcel_width || 0;
  req.parcel_weight = req.body.parcel_weight || 0;

  const small_box_length = 43;
  const small_box_height = 8;
  const small_box_width = 47;
  
  const medium_box_length = 43;
  const medium_box_height = 19;
  const medium_box_width = 47;
  
  const large_box_length = 43;
  const large_box_height = 28;
  const large_box_width = 47;

  if (req.parcel_height < small_box_height && req.parcel_width < small_box_width && req.parcel_length < small_box_length) {
    // small box
    req.locker_box_category = 3;
    req.locker_box_cost = await this.getAmount(req.body.lsp_id,3);

    // req.locker_box_cost = 1;
  } else if (req.parcel_height < medium_box_height && req.parcel_width < medium_box_width && req.parcel_length < medium_box_length) {
    //medium box
    req.locker_box_category = 2;
    req.locker_box_cost = await this.getAmount(req.body.lsp_id,2);
  } else if (req.parcel_height < large_box_height && req.parcel_width < large_box_width && req.parcel_length < large_box_length) {
    //large box
    req.locker_box_category = 1;
    // req.locker_box_cost = 2;
    req.locker_box_cost = await this.getAmount(req.body.lsp_id,1);
  } else {

    status = 0;
    // is_sufficient_capacity = 0;
    res.status(422).json(ResponseFormat.error(
      'parcel_is_too_large',
      req.body.reference_id,
      422
    ))
    // res.end(); // you don't need this `.json` will output+end the stream

  }
  return status;
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
exports.getBooking = async (req, res, transaction_id) =>{
  await sleep(5000);
  const order_no = await Order.findOne({
                        where: {
                          transaction_id: transaction_id
                        }
                   });
  if(!order_no){
    return 'not_exist';
  }else{
    const order_info = order_no.dataValues;
    const success_info = {'is_request_success':1};
    const order_list =  Object.assign(success_info,order_info);
    return order_list;
  }
 // return "test";
}

exports.getTrackingNumber = async (tracking_number)=> {
  const order_no = await Order.findOne({
    where: {
      order_number: tracking_number
    }
  })
  if (!tracking_number) {
    return 'should_not_null';
  }else if(!order_no){
    return 'not_find';
  }
  return order_no.dataValues
};

module.exports.getDrawerResourceInfo = async (locker_info,locker_box_category) => {

  const drawer_resource_info = await db.sequelize.query(`SELECT * FROM ems_drawer_resource_info  where device_number="${locker_info.device_number}" and drawer_status="0" and drawer_style="${locker_box_category}"`, {
                      type: sequelize.QueryTypes.SELECT
                   })
                  .then(drawer_resource_info => { // data is equal to the result of line 1.
                    if (drawer_resource_info.length == 0) {
                      return "insufficient_capacity";
                    }else{
                      return "avaialble_capacity";
                    }
                  });

  return drawer_resource_info;
};


module.exports.getCategoryName = async (locker_box_category) =>{

  if(locker_box_category == "3"){
    return "S";
  }else if(locker_box_category == "2"){
    return "M";
  }else{
    return "L";
  }

}
