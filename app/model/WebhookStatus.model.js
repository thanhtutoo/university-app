module.exports = (sequelize, Sequelize) => {
	const WebhookStatus = sequelize.define('ems_order_pushstatus_imda', {
	   id: {
	    type: Sequelize.STRING(50),
	    allowNull: false,
	    primaryKey: true,
	    autoIncrement: true
	  },
	  transaction_id: {
		  type: Sequelize.STRING
	  },	  
	  order_number: {
		  type: Sequelize.STRING
	  },		  
	  reference_id: {
		  type: Sequelize.STRING
	  },		  
	  locker_station_id: {
		  type: Sequelize.STRING
	  },	  
	  city_id: {
		  type: Sequelize.STRING
	  },	  
	  status_code: {
		  type: Sequelize.STRING
	  },	  
	  time: {
		  type: Sequelize.STRING
	  },
	  ps_data: {
		  type: Sequelize.STRING
	  },	  
	  data: {
		  type: Sequelize.STRING
	  },	  	  
	  status: {
		  type: Sequelize.STRING
	  },	  	  
	  remark: {
		  type: Sequelize.STRING
	  }	  
	},{
		freezeTableName: true,
		timestamps: false,
	});

	return WebhookStatus;
}
