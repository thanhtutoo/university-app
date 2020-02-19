module.exports = (sequelize, Sequelize) => {
	const RequestLog = sequelize.define('ems_imda_request_log', {
	  id: {
        type: Sequelize.INTEGER,
        primaryKey: true
	  },
	  reference_id: {
		  type: Sequelize.STRING
	  },
	  data: {
		  type: Sequelize.STRING
	  },
	  create_time: {
		  type: Sequelize.STRING
	  },
	  remark: {
		  type: Sequelize.STRING
	  },
	},{
		freezeTableName: true,
		timestamps: false,
	});

	
	return RequestLog;
}