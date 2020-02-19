module.exports = (sequelize, Sequelize) => {
	const BookingLog = sequelize.define('ems_booking_log', {
	  id: {
        type: Sequelize.INTEGER,
        primaryKey: true
	  },
	  reference_id: {
		  type: Sequelize.STRING
	  },
	  order_number: {
		  type: Sequelize.STRING
	  },
	  transaction_id: {
		  type: Sequelize.STRING
	  },
	  locker_station_id: {
		  type: Sequelize.STRING
	  },
	  lsp_id: {
		  type: Sequelize.STRING
	  }, 
	  time: {
		  type: Sequelize.STRING
	  },
	  data: {
		  type: Sequelize.STRING
	  },
	},{
		freezeTableName: true,
		timestamps: false,
	});

	
	return BookingLog;
}