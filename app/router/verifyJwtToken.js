const jwt = require('jsonwebtoken');
const config = require('../config/config.js');
const db = require('../config/db.config.js');
const Role = db.role;
const User = db.user;
const ResponseFormat = require('../core').ResponseFormat;
const winston = require('../../winston/config');
verifyToken = (req, res, next) => {
	winston.info('Booking request->'+JSON.stringify(req.body));
	// let token = req.headers['token'];
  	let reference_id = req.body.reference_id;


    const header = req.headers.authorization;

    if(typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];

		jwt.verify(token, config.secret, (err, decoded) => {
			if (err){
			 return res.status(422).json(ResponseFormat.validation_error(
	            reference_id,
	            422,
	            'failed_authentication'
	          ))
			}
			req.userId = decoded.id;
			next();
		});
    } else {
        //If header is undefined return Forbidden (403)
       return res.status(422).json(ResponseFormat.validation_error(
            reference_id,
            422,
            'no_token_providd'
          ))
    }

}

isIMDA = (req, res, next) => {
	// let token = req.headers['token'];
	let reference_id = req.body.reference_id;
	
	User.findByPk(req.userId)
		.then(user => {
			console.log(user);
			user.getRoles().then(roles => {
				console.log(roles);
				for(let i=0; i<roles.length; i++){
					console.log(roles[i].name);
					if(roles[i].name.toUpperCase() === "IMDA"){
						next();
						return;
					}
				}
				return res.status(422).json(ResponseFormat.validation_error(
		            reference_id,
		            422,
		            'no_token_provided'
		          ));
			})
		})
}

isAdmin = (req, res, next) => {
	let token = req.headers['x-access-token'];
	
	User.findByPk(req.userId)
		.then(user => {
			user.getRoles().then(roles => {
				for(let i=0; i<roles.length; i++){
					console.log(roles[i].name);
					if(roles[i].name.toUpperCase() === "ADMIN"){
						next();
						return;
					}
				}
				
				res.status(403).send("Require Admin Role!");
				return;
			})
		})
}

isPmOrAdmin = (req, res, next) => {
	let token = req.headers['x-access-token'];
	
	User.findByPk(req.userId)
		.then(user => {
			user.getRoles().then(roles => {
				for(let i=0; i<roles.length; i++){					
					if(roles[i].name.toUpperCase() === "PM"){
						next();
						return;
					}
					
					if(roles[i].name.toUpperCase() === "ADMIN"){
						next();
						return;
					}
				}
				
				res.status(403).send("Require PM or Admin Roles!");
			})
		})
}

const authJwt = {};
authJwt.verifyToken = verifyToken;
authJwt.isAdmin = isAdmin;
authJwt.isIMDA = isIMDA;
authJwt.isPmOrAdmin = isPmOrAdmin;

module.exports = authJwt;