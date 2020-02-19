const db = require('../config/db.config.js');
const config = require('../config/config.js');
const winston = require('../../winston/config');
const User = db.user;
const Order = db.order;
const Role = db.role;
const Device = db.device;
const axios = require('axios');
const qs =require('qs');
const sequelize = require('sequelize');
const ResponseFormat = require('../core').ResponseFormat;
const getToken = require('./LoginController.js').getToken;
var moment = require('moment');

// import sequelize from 'sequelize'

exports.createDevice = async function(req, res, next){
    winston.info('create Locker Station->'+JSON.stringify(req.body));

    const token = await getToken();
    const app_url = config.imda_app_url+'lockers/';
    // const transaction_id = req.body.transaction_id ||'';
    const device_number = req.body.device_number ||'';
    const request_type = req.body.request_type ||'create';
    const device = await db.sequelize.query(`SELECT * FROM ems_device where status in (0,1)`, {
      type: sequelize.QueryTypes.SELECT
    }).catch((err) => console.log(err));    
    

    if(device){

      // const device_update = device.forEach(function(device_info) {
      const device_info = await db.sequelize.query(`SELECT * FROM ems_device where device_number="${device_number}"`, {
        plain: true,
        type: sequelize.QueryTypes.SELECT
      }).catch((err) => console.log(err));
      var zip_code = device_info.zip_code.split("#");

      const device = await Device.findOne({
        where: {
          device_number: device_number
        }
      });
      var locker_station_id;
      if(request_type != 'create'){
        locker_station_id = device_info.locker_station_id;
      }
      const city =  db.sequelize.query(`SELECT * FROM sys_city where city_id ="${device_info.city_id1}"`, {
                    plain: true,
                    type: sequelize.QueryTypes.SELECT
                    }).then(city_info => {
                      console.log(city_info);
                            const data = {
                                    reference_id :"123",
                                    locker_station_id:locker_station_id,
                                    request_type:request_type,
                                    locker_station_name:city_info.city_name,
                                    locker_station_description:city_info.city_no,
                                    opening_hours:"24/7",
                                    block_number:'-',
                                    building_name:'-',
                                    street_name: city_info.address,
                                    state:"-",
                                    postal_code:zip_code[0],
                                    latitude:device_info.lat,
                                    longitude:device_info.lng,
                                    is_return_eligible:"1",
                                    lsp_user_close:"23:59:59+00:00",
                                    lsp_user_open:"00:01:01+00:00",
                                    is_otp_returns:"1",
                                    is_otp_collection:"0",
                                    is_otp_lsp_user:"0",
                                    locker_box_category_details:"L,M,S Available",
                                    locker_box_category:"",
                                    locker_box_category_quantity:"",
                                    locker_box_length:"",
                                    locker_box_width:"",
                                    locker_box_height:"",
                                    locker_box_weight_limit:"",
                                    country_code: "65",
                                    delivery_feature_available: [],
                                    payment_options_supported: [],
                                    locker_box_category_details: []
                                  };

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
                              console.log(data);
                              const api_call =  axios.post(app_url,data,axiosConfig)
                              .then(response => {
                                const response_data = response.data;
                                console.log(response);
                                const created_date_time = moment(response_data.created_date_time).unix();
                                const updated_date_time = moment(response_data.updated_date_time).unix();
                                const update_locker = db.sequelize.query(`UPDATE ems_device SET locker_station_id ="${response_data.locker_station_id}",
       created_time="${created_date_time}", updated_time="${updated_date_time}", remarks="" WHERE id ="${device_info.id}"`);                          
                                                device.update({
                                                    remarks: ''
                                                });               
      
                                res.status(201).json({'code':'success','responsTime':moment().format(),'msg':request_type});
                                }).catch((err) => { 
                                  device.update({
                                      remarks: JSON.stringify(err.response.data)
                                    });
                                  res.status(201).json({'code':'error','responsTime':moment().format(),'msg':err.response.data}); });
                    }).catch((err) => console.log(err));    
        // });
    }
  }




   
    



