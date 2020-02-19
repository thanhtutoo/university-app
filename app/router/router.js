const verifySignUp = require('./verifySignUp');
const authJwt = require('./verifyJwtToken');
const axios = require('axios');

module.exports = function(app) {

    const LoginController = require('../controller/LoginController.js');
    const OrderController = require('../controller/OrderController.js');
    const DeviceController = require('../controller/DeviceController.js');
    const TransactionController = require('../controller/TransactionController.js');
 
	app.get('/', (req, res) => {
  		 res.send( "IMDA Project" );
	});		
	app.post('/api/auth/signin', LoginController.signin);
	app.get('/gettoken', LoginController.getToken);
	app.post('/api/imdalogin', LoginController.imdaLogin);
	app.get('/api/triggertransaction', TransactionController.updateTransaction);
	app.post('/api/booking',[authJwt.verifyToken, authJwt.isIMDA], OrderController.createBooking);
	app.post('/api/booking/cancel',[authJwt.verifyToken, authJwt.isIMDA], OrderController.cancelBooking);
	app.post('/api/convertbooking', OrderController.convertBooking);
	app.post('/api/webhook', OrderController.webhook);
	app.get('/api/locker', DeviceController.createDevice);
	app.post('/api/locker', DeviceController.createDevice);

	// app.get('/api/test/user', LoginController.userContent);
	// app.post('/api/auth/signup', LoginController.signup);
	// app.get('/api/test/pm', [authJwt.verifyToken, authJwt.isIMDA], LoginController.managementBoard);
	// app.get('/api/test/admin', LoginController.adminBoard);
	// app.get('/api/test', TransactionController.updateTransaction);
	// app.get('/api/getkeys', LoginController.testBooking);
}

