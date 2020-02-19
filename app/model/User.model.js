module.exports = (sequelize, Sequelize) => {
	const User = sequelize.define('sys_user', {
	  name: {
		  type: Sequelize.STRING
	  },
	  username: {
		  type: Sequelize.STRING
	  },
	  email: {
		  type: Sequelize.STRING
	  },
	  password: {
		  type: Sequelize.STRING
	  },
	  remark: {
		  type: Sequelize.STRING
	  }
	},{
		freezeTableName: true,
		timestamps: false,
	});

	return User;
}