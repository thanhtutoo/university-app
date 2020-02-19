module.exports = (sequelize, Sequelize) => {
	const ResponseLog = sequelize.define('ems_imda_response_log', {
	   id: {
	    type: Sequelize.STRING(50),
	    allowNull: false,
	    primaryKey: true,
	    autoIncrement: true
	  }, 
	  reference_id: {
		  type: Sequelize.STRING
	  },		  
	  remark: {
		  type: Sequelize.STRING
	  },		  
	  data: {
		  type: Sequelize.STRING
	  }, 
	  status: {
		  type: Sequelize.STRING
	  },
	  time: {
		  type: Sequelize.STRING
	  },
	  date: {
		  type: Sequelize.STRING
	  },	  
	},{
		freezeTableName: true,
		timestamps: false,
	});

	return ResponseLog;
}
