var dateFormat = require('dateformat');
const db = require('../config/db.config.js');
var moment = require('moment');
const ResponseLog = db.response_log;

const ResponseFormat = {
        build : (data, message, statusCode, statusType)  => {

             const order_create = ResponseLog.create({
             reference_id          : data.reference_id || '',
             data                  : JSON.stringify(data),
             remark                : message || '',
             status                : 'success' || '',
             time                  : moment().unix(),
             date                  : moment().format("YYYY-MM-DD HH:mm:ss"),
             });
            return {
                is_request_success:true,
		        error_message:null,
                reference_id:data.reference_id,
                response_date_time:moment().format(),
                locker_station_id:data.locker_station_id,
                locker_box_category:data.locker_box_category,
                locker_box_cost:data.locker_box_cost,
                locker_box_cost_currency:data.locker_box_cost_currency,
                transaction_id:data.transaction_id,
                statusCode: statusCode,
                message: message,
                statusType: statusType,
            }
        },
        error : (message,reference_id,statusCode,object,statusType) => {
             const order_create = ResponseLog.create({
             reference_id          : reference_id || '',
             // data                  : data,
             remark                : message || '',
             status                : 'failed' || '',
             time                  : moment().unix(),
             date                  : moment().format("YYYY-MM-DD HH:mm:ss"),
             });
            return {
                is_request_success:false,
                error_message: message,
                reference_id: reference_id,
                statusCode: statusCode,
                error_details: object,
                response_date_time:moment().format(),
                statusType: statusType
            }
        },        
        pserror : (message) => {
            if(message == "LSP User is disabled / does not exist. Please contact LSP."){
                return {'code':"80001",'responsTime':moment().format(),'msg':message,is_request_success:false};
            }else if(message == "PIN expired. Please renew PIN."){
                return {'code':"80002",'responsTime':moment().format(),'msg':message,is_request_success:false};
            }else if(message == "LSP User not activated."){
                return {'code':"80003",'responsTime':moment().format(),'msg':message,is_request_success:false};
            }else if(message == "Locker station is not accessible at this time."){
                return {'code':"80004",'responsTime':moment().format(),'msg':message,is_request_success:false};
            }else if(message == "Invalid Consumer Access Key"){
                return {'code':"80005",'responsTime':moment().format(),'msg':message,is_request_success:false};
            }else if(message == "lsp_id or tracking_no cannot be present if consumer_access_key is specified in request"){
                return {'code':"80006",'responsTime':moment().format(),'msg':message,is_request_success:false};
            }else if(message == "Returns are not allowed at this locker station"){
                return {'code':"80007",'responsTime':moment().format(),'msg':message,is_request_success:false};
            }else if(message == "Reservation does not exist"){
                return {'code':"80008",'responsTime':moment().format(),'msg':message,is_request_success:false};
            }else if(message == "Reservation has expired"){
                return {'code':"80009",'responsTime':moment().format(),'msg':message,is_request_success:false};
            }else if(message == "Reservation has been cancelled"){
                return {'code':"80010",'responsTime':moment().format(),'msg':message,is_request_success:false};
            }else if(message == "Insufficient locker box capacity at locker station. Please try depositing at another locker station."){
                return {'code':"80011",'responsTime':moment().format(),'msg':message,is_request_success:false};
            }else if(message == "Insufficient locker box capacity at locker station."){
                return {'code':"80012",'responsTime':moment().format(),'msg':message,is_request_success:false};
            }else if(message == "System error occurred. Please contact the LSP/Carrier and inform of the error code (invalid_requestor_key)."){
                return {'code':"80013",'responsTime':moment().format(),'msg':message,is_request_success:false};
            }else if(message == "System error occurred. Please contact the LSP/Carrier and inform of the error code (locker_station_not_found)."){
                return {'code':"80014",'responsTime':moment().format(),'msg':message,is_request_success:false};
            }else if(message == "System error occurred. Please contact the LSP/Carrier and inform of the error code (locker_station_disabled)."){
                return {'code':"80015",'responsTime':moment().format(),'msg':message,is_request_success:false};
            }else{
                return {'code':"90000",'responsTime':moment().format(),'msg':message,is_request_success:false};
            }
            //{'code':'0001','responsTime':moment().format(),'msg':err.response.data.error_message})
            
        },
        validation_error : (reference_id,statusCode,object,statusType) => {
             const order_create = ResponseLog.create({
             reference_id          : reference_id || '',
             data                  : JSON.stringify(object),
             remark                : 'validation_error',
             status                : 'failed' || '',
             time                  : moment().unix(),
             date                  : moment().format("YYYY-MM-DD HH:mm:ss"),
             });
            return {
                is_request_success:false,
                error_message: 'validation_error',
                reference_id: reference_id,
                statusCode: statusCode,
                error_details: object,
                response_date_time: moment().format(),
                statusType: statusType
            }
        }
    }

module.exports = ResponseFormat


