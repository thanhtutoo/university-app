module.exports = (sequelize, Sequelize) => {
	const Order = sequelize.define('ems_order_info', {
	   order_id: {
	    type: Sequelize.STRING(50),
	    allowNull: false,
	    primaryKey: true,
	    autoIncrement: true
	  },
	  order_number: {
		  type: Sequelize.STRING
	  },
	  receiver_name: {
		  type: Sequelize.STRING
	  },
	  receiver_phone: {
		  type: Sequelize.STRING
	  },	  
	  receiver_password: {
		  type: Sequelize.STRING
	  },
	  dw_price: {
		  type: Sequelize.STRING
	  },
	  currency: {
		  type: Sequelize.STRING
	  },
	  pay_type: {
		  type: Sequelize.STRING
	  },
	  business_code: {
		  type: Sequelize.STRING
	  },
	  quick_reference: {
		  type: Sequelize.STRING
	  },	  
	  e_orderid: {
		  type: Sequelize.STRING
	  },
	  enterprise_number: {
		  type: Sequelize.STRING
	  },
	  device_number: {
		  type: Sequelize.STRING
	  },	  
	  drawer_number: {
		  type: Sequelize.STRING
	  },
	  email: {
		  type: Sequelize.STRING
	  },
	  room_no: {
		  type: Sequelize.STRING
	  },	  
	  zip_code: {
		  type: Sequelize.STRING
	  },	  
	  city_id: {
		  type: Sequelize.STRING
	  },	  
	  city_id1: {
		  type: Sequelize.STRING
	  },	  
	  staff_id: {
		  type: Sequelize.STRING
	  },	  
	  order_status: {
		  type: Sequelize.STRING
	  },	  
	  order_time: {
		  type: Sequelize.STRING
	  },		  
	  over_time: {
		  type: Sequelize.STRING
	  },	  
	  pickup_type: {
		  type: Sequelize.STRING
	  },	  
	  order_type: {
		  type: Sequelize.STRING
	  },	  
	  plat_ent_no: {
		  type: Sequelize.STRING
	  },	  
	  length: {
		  type: Sequelize.STRING
	  },	  
	  height: {
		  type: Sequelize.STRING
	  },	  
	  width: {
		  type: Sequelize.STRING
	  },	  
	  item_desc: {
		  type: Sequelize.STRING
	  },	  
	  reference_id: {
		  type: Sequelize.STRING
	  },	  
	  requestor_key: {
		  type: Sequelize.STRING
	  },	  
	  transaction_id: {
		  type: Sequelize.STRING
	  },	  
	  lsp_id: {
		  type: Sequelize.STRING
	  },	  
	  content_scanned_status: {
		  type: Sequelize.STRING
	  },	  
	  content_scanned_description: {
		  type: Sequelize.STRING
	  },	  
	  content_description: {
		  type: Sequelize.STRING
	  },	  
	  payment_required: {
		  type: Sequelize.STRING
	  },	  
	  payment_amount: {
		  type: Sequelize.STRING
	  },	  
	  payment_currency: {
		  type: Sequelize.STRING
	  },	  
	  delivery_feature_required: {
		  type: Sequelize.STRING
	  },	  
	  Send_access_key_to_lsp: {
		  type: Sequelize.STRING
	  },	   
	  locker_station_id: {
		  type: Sequelize.STRING
	  },	    
	  locker_box_category: {
		  type: Sequelize.STRING
	  },	  
	  locker_box_cost: {
		  type: Sequelize.STRING
	  },	 	  
	  locker_box_cost_currency: {
		  type: Sequelize.STRING
	  },	  
	  sign_url: {
		  type: Sequelize.STRING
	  },	  
	  is_imda: {
		  type: Sequelize.STRING
	  },	  
	  is_return_delivery: {
		  type: Sequelize.STRING
	  },	  
	  is_book: {
		  type: Sequelize.STRING
	  }
	},{
		freezeTableName: true,
		timestamps: false,
	});

	return Order;
}

// var User = sequelize.define('user', {
//   firstName: {
//     type: Sequelize.STRING,
//     field: 'first_name' // Will result in an attribute that is firstName when user facing but first_name in the database
//   },
//   lastName: {
//     type: Sequelize.STRING
//   }
// }, {
//   freezeTableName: true // Model tableName will be the same as the model name
// });