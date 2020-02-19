module.exports = (sequelize, Sequelize) => {
	const BookingFailedLog = sequelize.define('ems_booking_failed_log', {
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
	  remark: {
		  type: Sequelize.STRING
	  },
	  create_time: {
		  type: Sequelize.STRING
	  },
	},{
		freezeTableName: true,
		timestamps: false,
	});

	
	return BookingFailedLog;
}