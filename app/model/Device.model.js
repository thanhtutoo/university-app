module.exports = (sequelize, Sequelize) => {
	const Device = sequelize.define('ems_device', {
	  id: {
	    type: Sequelize.STRING(50),
	    allowNull: false,
	    primaryKey: true,
	    autoIncrement: true
	  },
	  device_number: {
		  type: Sequelize.STRING
	  },  
	  locker_station_id: {
		  type: Sequelize.STRING
	  },	  
	  remarks: {
		  type: Sequelize.STRING
	  }
	},{
		freezeTableName: true,
		timestamps: false,
	});

	return Device;
}