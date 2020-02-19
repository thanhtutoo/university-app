module.exports = (sequelize, Sequelize) => {
	const Staff = sequelize.define('ems_staff', {
	   id: {
	    type: Sequelize.STRING(50),
	    allowNull: false,
	    primaryKey: true,
	    autoIncrement: false
	  },
	  username: {
		  type: Sequelize.STRING
	  },	  
	  password: {
		  type: Sequelize.STRING
	  },
	  token: {
		  type: Sequelize.STRING
	  },
	  token_expire_time: {
		  type: Sequelize.STRING
	  },	  
	  logintime: {
		  type: Sequelize.STRING
	  },	  
	  loginip: {
		  type: Sequelize.STRING
	  },	  
	  status: {
		  type: Sequelize.STRING
	  },	  
	  user_type: {
		  type: Sequelize.STRING
	  },	  
	  city_id: {
		  type: Sequelize.STRING
	  },	  
	  name: {
		  type: Sequelize.STRING
	  },	  
	  phone: {
		  type: Sequelize.STRING
	  },	  
	  register_time: {
		  type: Sequelize.STRING
	  },	  
	  identify_no: {
		  type: Sequelize.STRING
	  },	  
	  sex: {
		  type: Sequelize.STRING
	  },	  
	  userimage: {
		  type: Sequelize.STRING
	  },	  
	  user_des: {
		  type: Sequelize.STRING
	  },	  
	  user_money: {
		  type: Sequelize.STRING
	  },	  
	  user_no: {
		  type: Sequelize.STRING
	  },	  
	  email: {
		  type: Sequelize.STRING
	  },	  
	  login_otp: {
		  type: Sequelize.STRING
	  },	  
	  login_otp_ori: {
		  type: Sequelize.STRING
	  },
	  is_imda: {
		  type: Sequelize.STRING
	  }	  
	},{
		freezeTableName: true,
		timestamps: false,
	});

	return Staff;
}
