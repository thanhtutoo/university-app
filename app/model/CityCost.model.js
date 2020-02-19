module.exports = (sequelize, Sequelize) => {
	const CityCost = sequelize.define('sys_city_cost', {
	  cid: {
	    type: Sequelize.STRING(50),
	    allowNull: false,
	    primaryKey: true,
	    autoIncrement: true
	  },
	  order_id: {
		  type: Sequelize.STRING
	  },	  
	  order_number: {
		  type: Sequelize.STRING
	  },	  
	  city_id: {
		  type: Sequelize.STRING
	  },	  
	  city_type: {
		  type: Sequelize.STRING
	  },	  
	  cost_type: {
		  type: Sequelize.STRING
	  },	  
	  debit_amount: {
		  type: Sequelize.STRING
	  },	  
	  credit_amount: {
		  type: Sequelize.STRING
	  },	  
	  add_time: {
		  type: Sequelize.STRING
	  },	  
	  update_time: {
		  type: Sequelize.STRING
	  },	  
	  change_desc: {
		  type: Sequelize.STRING
	  },	  
	  cost_status: {
		  type: Sequelize.STRING
	  },	  
	  operator_id: {
		  type: Sequelize.STRING
	  },	  
	  use_number: {
		  type: Sequelize.STRING
	  },	  
	  remark: {
		  type: Sequelize.STRING
	  },	  
	  drawer_number: {
		  type: Sequelize.STRING
	  },	  
	  locker_box_category: {
		  type: Sequelize.STRING
	  },	  
	  update_desc: {
		  type: Sequelize.STRING
	  }
	},{
		freezeTableName: true,
		timestamps: false,
	});

	return CityCost;
}