module.exports = (sequelize, Sequelize) => {
	const DrawerLog = sequelize.define('ems_drawer_log', {
	  id: {
	    type: Sequelize.STRING(50),
	    allowNull: false,
	    primaryKey: true,
	    autoIncrement: true
	  },
	  device_number: {
		  type: Sequelize.STRING
	  },
	  drawer_number: {
		  type: Sequelize.STRING
	  },	  
	  order_number: {
		  type: Sequelize.STRING
	  },	  
	  receiver_phone: {
		  type: Sequelize.STRING
	  },	  
	  oper_type: {
		  type: Sequelize.STRING
	  },	  
	  oper_time: {
		  type: Sequelize.STRING
	  },  
	  city_id: {
		  type: Sequelize.STRING
	  },	  
	  remark: {
		  type: Sequelize.STRING
	  }
	},{
		freezeTableName: true,
		timestamps: false,
	});

	return DrawerLog;
}