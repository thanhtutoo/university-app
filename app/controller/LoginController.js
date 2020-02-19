const db = require('../config/db.config.js');
const config = require('../config/config.js');
const winston = require('../../winston/config');
const User = db.user;
const Role = db.role;
const Order = db.order;
const Staff = db.staff;
const axios = require('axios');
const qs =require('qs');
const sequelize = require('sequelize');
const Op = db.Sequelize.Op;
var moment = require('moment');
const crypto = require('crypto');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
// const exec = require('child_process').exec;
const ResponseFormat = require('../core').ResponseFormat;

// async function staffAcc(lsp_user_key,lsp_user_pin){
// 	if(lsp_user_key == '123456' && lsp_user_pin == '123456'){
// 		account_info = {lsp_user_key:'069952501466',lsp_user_pin:'123456'};
// 		return account_info;
// 	}else if (lsp_user_key == '069952501466' && lsp_user_pin == '123456'){
// 		account_info = {lsp_user_key:'069952501466',lsp_user_pin:'123456'};
// 		return account_info;
// 	}else{
// 		account_info = {lsp_user_key:lsp_user_key,lsp_user_pin:lsp_user_pin};
// 		return account_info;
// 	}
// }
module.exports.imdaLogin =  async (req, res) => {

	const app_url = config.imda_app_url+'locker-access/lsp-user/';
	const token = await this.getToken();
	const client_secret = config.client_secret;
	const reference_id = req.body.reference_id||'PS'+Math.round((new Date()).getTime() / 1000);
	const lsp_user_key = req.body.lsp_user_key;
	const lsp_user_pin = req.body.lsp_user_pin;
	console.log(lsp_user_key);
	console.log(lsp_user_pin);
	console.log('lsp_user_pin');
	console.log(req.body.username);

	// const account = await staffAcc(req.body.lsp_user_key,req.body.lsp_user_pin); 
	// const lsp_user_key = account_info.lsp_user_key||'069952501466';
	// const lsp_user_pin = account_info.lsp_user_pin||'123456';
	const device_number = req.body.device_number||'TESTRK001';

	// const locker_station_id = req.body.locker_station_id||'2e0cc1b2-ce23-4ff0-9725-d14f8dc0134d';
	// const bb = await this.aa(req, res,client_secret,lsp_user_key,lsp_user_pin);
	// const testdecrypt = exec('python3 crypto.py edecrypt '+ client_secret +' jA0ECQMC7c4tXiRn0ZH%2F0j8BG3H%2F4c4p4H%2FxPCpifQ6X7ViypjHPorjPw41iAGqhjq6XY7JY8Frj80TsJe7q%2FxZECEzbjb3h4LZ4DxQyQMQ%3D');
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
	// const device_number = locker_info.device_number;
	if (typeof locker_info !== 'undefined'){
	 if(locker_info){
		const drawer_info = await db.sequelize.query(`SELECT * FROM ems_drawer_resource_info where device_number="${locker_info.device_number}"`, {
								      // plain: true,
								      type: sequelize.QueryTypes.SELECT
								    }).catch(err => {
							          winston.error('No Locker station ->'+err)
							          res.status(500).send("Fail! Error ->" + err);
							        });

		const { stdout, stderr } = await exec('python3 crypto.py eencrypt '+ client_secret +' '+ lsp_user_key +':'+lsp_user_pin);

		if (stderr) {
			res.status(422).json(ResponseFormat.validation_error(
			        reference_id,
			        422,
			        'Encryption fail!'
			      ))
		}
		lsp_user_credentials = stdout;
		console.log(lsp_user_credentials);
		let axiosConfig = {
		                  rejectUnauthorized: false,
		                  requestCert: true,
		                  strictSSL: false,
		                  agent: false,
		                    headers: {
		                        'Content-Type': 'application/json;charset=UTF-8',
		                        'Authorization':' Bearer '+token.access_token
		                      
		                    },
		                     params: {
					        	reference_id :"123",
					        	locker_station_id:locker_info.locker_station_id,
					        	lsp_user_credentials:decodeURIComponent(lsp_user_credentials)
					        },
		                  };
		const data_list = {"zip_code":locker_info.zip_code,"device_number":device_number};
		// const get_imda_info = await getIMDAInfo(req,res,axiosConfig,data_list);
		const app_url = config.imda_app_url+'locker-access/lsp-user/';
		console.log(axiosConfig);
		const api_call = await axios.get(app_url,axiosConfig)
			              .catch((err) => { 
			                	// console.log(err.response.config)
			                	winston.error('Login Failed->'+JSON.stringify(err.response.data))
			                	res.status(200).json(ResponseFormat.pserror(
		                        err.response.data.error_message
		                        ))
			                });
	    if(typeof api_call != "undefined"){
			if(api_call.data.is_request_success == true){
		   		const city_info = await db.sequelize.query(`SELECT * FROM sys_city where city_id="${api_call.data.lsp_user_details.lsp_id}"`, {
			      plain: true,
			      type: sequelize.QueryTypes.SELECT
			   	});

			   	const expired_order = await Order.findAll({
			   							  raw: true ,
			   							  attributes: ['business_code','device_number','order_number','drawer_number','room_no','postin_time','over_time','dw_price','receiver_phone','order_status','pickup_type','city_id','city_id1'],
									      where: {
									        city_id: api_call.data.lsp_user_details.lsp_id,
									        order_status:[1],
									        device_number:data_list.device_number,
									        over_time: {
											      [Op.lt]: Math.round((new Date()).getTime() / 1000) // soon to be replaced by [Op.lte]
										    }
									      }
									    })

			   	const returned_order = await Order.findAll({
			   							  raw: true ,
			   							  attributes: ['business_code','device_number','order_number','drawer_number','room_no','postin_time','over_time','dw_price','receiver_phone','order_status','pickup_type','city_id','city_id1'],
									      where: {
									        city_id: api_call.data.lsp_user_details.lsp_id,
									        order_status:[7],
									        device_number:data_list.device_number
									      }
									    })

			   	var merged_order =  expired_order.concat(returned_order);
			   	var order_list = (merged_order.length > 0) ? merged_order : null;
			   	const is_retrieval_allowed = (api_call.data.lsp_user_details.is_retrieval_allowed == true) ? "1":"0";
				if(expired_order.length != 0 || returned_order.length != 0){

					const info = {"code":"success","msg":"Successfully login!",
								"data":{staff_id:api_call.data.lsp_user_details.lsp_user_id,"is_retrieval_allowed":is_retrieval_allowed,"city_id":api_call.data.lsp_user_details.lsp_id,"company_name":city_info.city_name,
								"name":"Than Htut","nric":api_call.data.lsp_user_details.lsp_id,"balance":"0.00","staff_type":"0",
								"remain_count":"NO_LIMIT","user_type":"1","zip_code":data_list.zip_code,
								"is_forbidden":"1","is_over_time":"1","over_time_list":order_list,"account_list":null}}

		    		res.status(200).json(info);

				}else{
					const info = {"code":"success","msg":"Successfully login!",
								"data":{staff_id:api_call.data.lsp_user_details.lsp_user_id,"is_retrieval_allowed":is_retrieval_allowed,"city_id":api_call.data.lsp_user_details.lsp_id,"company_name":city_info.city_name,
								"name":"Than Htut","nric":api_call.data.lsp_user_details.lsp_id,"balance":"0.00","staff_type":"0",
								"remain_count":"NO_LIMIT","user_type":"1","zip_code":data_list.zip_code,
								"is_forbidden":"1","is_over_time":"0","over_time_list":order_list,"account_list":null}}

		    		res.status(200).json(info);
				}
				// const staff_id = api_call.data.lsp_user_details.lsp_user_id;
			   	const staff_info = await Staff.findOne({
								    where: {
								      id:api_call.data.lsp_user_details.lsp_user_id
								    }
								  })
			   	if(staff_info == null){
			   		// console.log('a');
			   		const staff_create = await Staff.create({
			   					id               : api_call.data.lsp_user_details.lsp_user_id,
		   	  				    username		 : lsp_user_key,
		  						password	 	 : lsp_user_pin,
					  			token	 		 : '',
								token_expire_time: 0,
								logintime	     : 0,
								loginip	 		 : '',
								status	 		 : 0,
								user_type	 	 : 1,
								city_id	  		 : api_call.data.lsp_user_details.lsp_id,
								name	 		 : lsp_user_key,
								phone	 		 : api_call.data.lsp_user_details.lsp_user_mobile,
								register_time	 : Math.round((new Date()).getTime() / 1000),
								identify_no	 	 : lsp_user_key,
								sex	 			 : 0,
								userimage	 	 : '',
								user_des	 	 : '',
								user_money	 	 : '0.00',
								user_no	 		 : '',
								email	  		 : '',
								login_otp	 	 : '',
								login_otp_ori	 : '',
								is_imda			 : 1
			   		}).catch(err => {
                      winston.error('failed_staff_create ->'+err)
                    });
                    console.log(staff_create);

			   	}
		   	
			}else{
            	res.status(200).json(ResponseFormat.pserror(
                	"login_error"
                ))
			}
		}

	 }else{
		 res.status(422).json(ResponseFormat.error(
            'locker_station_not_found',
            reference_id,
            422
          ))
	 }
	}

	
}


module.exports.getToken =  async (req, res) => {
  const app_url = config.imda_app_url+'token/';
  const username = 'KAIcggedvNxLXmb0A6QeFota0MUgnWWX22ucBieC';
  const password = 'sLEB2kY1276FgKYdZ6Myp1FhSRBJuvbwY7yOrT6ManJsW66EsaXwH1R4J5cPg2grJqSI8t';
  var auth = 'Basic ' + Buffer.from(username + ':' + password).toString('base64');

  const data = qs.stringify({
  grant_type: 'client_credentials',
  });
  let axiosConfig = {
  rejectUnauthorized: false,
  requestCert: true,
  strictSSL: false,
  agent: false,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Authorization': auth,
    },
  };
  const token_info = await db.sequelize.query(`SELECT * FROM ems_webhook_token where id="4"`, {
				      plain: true,
				      type: sequelize.QueryTypes.SELECT
				      });
  const current_time = moment().unix();
  if(token_info){	
   if(token_info.expire_in > current_time){
   	  const data = {access_token:token_info.token};
   	  return data;
   }
   else{
   	  	try {
        // this parse may fail
		const api_call = await axios.post(app_url,data,axiosConfig);

	    const current_time = moment().unix();
	    // console.log(current_time);
	    const expire_in = parseInt(api_call.data.expires_in) + parseInt(current_time);
		    // console.log("RESPONSE RECEIVED: ", expire_in);    
	    const update_token = await db.sequelize.query(`UPDATE ems_webhook_token SET token ="${api_call.data.access_token}",
	     expire_in="${expire_in}" WHERE id =4`);

	    // console.log("AXIOS ERROR: ", update_token);
	    const token = {access_token: api_call.data.access_token};
	    // console.log(token);
	    return token;
		} catch (err) {
		    console.log(err)
		}
  		
   }
  }
}

exports.signup = (req, res) => {
	// Save User to Database
	console.log("Processing func -> SignUp");
	
	User.create({
		name: req.body.name,
		username: req.body.username,
		email: req.body.email,
		remark: 'IMDA',
		password: bcrypt.hashSync(req.body.password, 8)
	}).then(user => {
		Role.findAll({
		  where: {
			name: {
			  [Op.or]: [req.body.roles]
			}
		  }
		}).then(roles => {
			user.setRoles(roles).then(() => {
				res.send("User registered successfully!");
            });
		}).catch(err => {
			res.status(500).send("Error -> " + err);
		});
	}).catch(err => {
		res.status(500).send("Fail! Error -> " + err);
	})
}

exports.signin = (req, res) => {
	// console.log("Sign-In");
	const reference_id = req.body.reference_id|| '';

	const base64Credentials =  req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

	User.findOne({
		where: {
			username: username
		}
	}).then(user => {
		if (!user) {
		  return res.status(422).json(ResponseFormat.validation_error(
            reference_id,
            422,
            'user_not_found'
          ))
			// return res.status(404).send('User Not Found.');
		}
		var passwordIsValid = bcrypt.compareSync(password, user.password);
		if (!passwordIsValid) {

		  return res.status(422).json(ResponseFormat.validation_error(
            reference_id,
            422,
            'invalid_password'
          ))
			// return res.status(401).send({ auth: false, accessToken: null, reason: "Invalid Password!" });
		}
		
		var token = jwt.sign({ id: user.id }, config.secret, {
		  expiresIn: 3000 // expires in 1 hours 259200= 48 hr
		});
		
		res.status(200).send({ auth: true, access_token: token, expires_in: 3000 });
		
	}).catch(err => {
		res.status(500).send('Error -> ' + err);
	});
}

exports.userContent = (req, res) => {
	User.findOne({
		attributes: ['name', 'username', 'email'],
		include: [{
			model: Role,
			// attributes: ['id', 'name'],
			
		}]
	}).then(user => {
		res.status(200).json({
			"description": "User  Page",
			"user": user
		});
	}).catch(err => {
		res.status(500).json({
			"description": "Can not access User Page",
			"error": err
		});
	})
}
exports.adminBoard = (req, res) => {

const app_url = 'https://apisandbox.federatedlockers.net/v1/lsp-users/lo-query/';
   var postData = {
  email: "test@test.com",
  password: "passwords"
  };

  let axiosConfig = {
  rejectUnauthorized: false,
  requestCert: true,
  strictSSL: false,
  agent: false,
    headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Authorization':' Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IlNBel84cWJRekJkRExyNEZxQ1pYUkpZTmdxeTgxYV9VOGxXdFpvbkhpVm8ifQ.eyJhdWQiOiJLQUljZ2dlZHZOeExYbWIwQTZRZUZvdGEwTVVnbldXWDIydWNCaWVDIiwiZXhwIjoxNTU5MTIyNzcyLCJpYXQiOjE1NTkxMTkxNzIsImlzcyI6ImNvZ25pdG8tc2FuZGJveCIsInNjb3BlIjoidjEvdG9rZW4vIHYxL2xzcC11c2Vycy9sby1xdWVyeS8gdjEvbG9ja2Vycy8gdjEvdHJhbnNhY3Rpb25zL292ZXJ2aWV3LyB2MS90cmFuc2FjdGlvbnMvZGV0YWlscy8gdjEvdHJhbnNhY3Rpb24tdXBkYXRlLyB2MS9sb2NrZXItYWNjZXNzL2xzcC11c2VyLyB2MS9sb2NrZXItYWNjZXNzL3Jlc2VydmF0aW9uLXF1ZXJ5LyIsInN1YiI6IktBSWNnZ2Vkdk54TFhtYjBBNlFlRm90YTBNVWduV1dYMjJ1Y0JpZUMifQ.ezDkKZvT0XkDIrr_rPxT_o4QaNDcIDywHg9ifQG6KvxA_sX1ftfj0HVwEKB0q3Babf3xaOVDwylJAzGnWx_b2_l3xyIJUF-RCI5FzRsMtt8KTO9ekqOXhmcesehcuBnPN6dzjM_P153GaYeJZir_hxEysu3a4m_6ht29441dJcop71K57KBWFAaMEiaLYV1S95CX_OlJGupO6Rghxfq9hb5B9_qDm3bqBO492B3Z0KTVjG5p-XS7YgGOn5aLQCEabWVctE8wkMnfSrYPXw9mPFbxqEk_IazIDJyPxLXB15LoOS6W2UQduZjeCK7G1T2gyovNeznrV9PWiZeaUOHi3A'
    },
    params: {
      reference_id: "1233",
      last_updated_from_date_time:"2018-12-01T20:28:37+01:00"
    }
  };

  axios.get(app_url,axiosConfig)
  .then((response) => {
    console.log("RESPONSE RECEIVED: ", response);
    res.send(response.data);
  })
  .catch((err) => {
    console.log("AXIOS ERROR: ", err);
  })
}

exports.managementBoard = (req, res) => {
	User.findOne({
		where: {id: req.userId},
		attributes: ['name', 'username', 'email'],
		include: [{
			model: Role,
			attributes: ['id', 'name'],
			through: {
				attributes: ['userId', 'roleId'],
			}
		}]
	}).then(user => {
		res.status(200).json({
			"description": "Management Board",
			"user": user
		});
	}).catch(err => {
		res.status(500).json({
			"description": "Can not access Management Board",
			"error": err
		});
	})
}