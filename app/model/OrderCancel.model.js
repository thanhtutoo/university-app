module.exports = (sequelize, Sequelize) => {
	const OrderCancel = sequelize.define('ems_cancel_order', {
	  order_id: {
	    type: Sequelize.STRING,
	  },
	  transaction_id: {
		  type: Sequelize.STRING
	  },
	  reference_id: {
		  type: Sequelize.STRING
	  },
	  is_consumer_return_abort: {
		  type: Sequelize.STRING
	  },
	  cancellation_reason: {
		  type: Sequelize.STRING
	  },
	  created_at: {
		  type: Sequelize.STRING
	  }
	},{
		freezeTableName: true,
		timestamps: false,
	});

	return OrderCancel;
}
