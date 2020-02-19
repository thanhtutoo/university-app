const db = require('../config/db.config.js');
const config = require('../config/config.js');
const User = db.user;
const Role = db.role;
const axios = require('axios');
const Op = db.Sequelize.Op;

var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');

exports.signup = (req, res) => {
	// Save User to Database
	console.log("Processing func -> SignUp");
	
	User.create({
		name: req.body.name,
		username: req.body.username,
		email: req.body.email,
		password: bcrypt.hashSync(req.body.password, 8)
	}).then(user => {
		Role.findAll({
		  where: {
			name: {
			  [Op.or]: req.body.roles
			}
		  }
		}).then(roles => {
			user.setRoles(roles).then(() => {
				res.send("User registered successfully!");
            });
		}).catch(err => {
			res.status(500).send("Error -> " + err);
		});
	}).catch(err => {
		res.status(500).send("Fail! Error -> " + err);
	})
}

exports.signin = (req, res) => {
	console.log("Sign-In");
	
	User.findOne({
		where: {
			username: req.body.username
		}
	}).then(user => {
		if (!user) {
			return res.status(404).send('User Not Found.');
		}

		var passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
		if (!passwordIsValid) {
			return res.status(401).send({ auth: false, accessToken: null, reason: "Invalid Password!" });
		}
		
		var token = jwt.sign({ id: user.id }, config.secret, {
		  expiresIn: 86400 // expires in 24 hours
		});
		
		res.status(200).send({ auth: true, accessToken: token });
		
	}).catch(err => {
		res.status(500).send('Error -> ' + err);
	});
}

exports.userContent = (req, res) => {
	User.findOne({
		where: {id: req.userId},
		attributes: ['name', 'username', 'email'],
		include: [{
			model: Role,
			attributes: ['id', 'name'],
			through: {
				attributes: ['userId', 'roleId'],
			}
		}]
	}).then(user => {
		res.status(200).json({
			"description": "User Content Page",
			"user": user
		});
	}).catch(err => {
		res.status(500).json({
			"description": "Can not access User Page",
			"error": err
		});
	})
}

exports.adminBoard = (req, res) => {

const app_url = 'https://apisandbox.federatedlockers.net/v1/lsp-users/lo-query/';
   var postData = {
  email: "test@test.com",
  password: "password"
  };

  let axiosConfig = {
  rejectUnauthorized: false,
  requestCert: true,
  strictSSL: false,
  agent: false,
    headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Authorization':' Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IlNBel84cWJRekJkRExyNEZxQ1pYUkpZTmdxeTgxYV9VOGxXdFpvbkhpVm8ifQ.eyJhdWQiOiJLQUljZ2dlZHZOeExYbWIwQTZRZUZvdGEwTVVnbldXWDIydWNCaWVDIiwiZXhwIjoxNTU5MTIyNzcyLCJpYXQiOjE1NTkxMTkxNzIsImlzcyI6ImNvZ25pdG8tc2FuZGJveCIsInNjb3BlIjoidjEvdG9rZW4vIHYxL2xzcC11c2Vycy9sby1xdWVyeS8gdjEvbG9ja2Vycy8gdjEvdHJhbnNhY3Rpb25zL292ZXJ2aWV3LyB2MS90cmFuc2FjdGlvbnMvZGV0YWlscy8gdjEvdHJhbnNhY3Rpb24tdXBkYXRlLyB2MS9sb2NrZXItYWNjZXNzL2xzcC11c2VyLyB2MS9sb2NrZXItYWNjZXNzL3Jlc2VydmF0aW9uLXF1ZXJ5LyIsInN1YiI6IktBSWNnZ2Vkdk54TFhtYjBBNlFlRm90YTBNVWduV1dYMjJ1Y0JpZUMifQ.ezDkKZvT0XkDIrr_rPxT_o4QaNDcIDywHg9ifQG6KvxA_sX1ftfj0HVwEKB0q3Babf3xaOVDwylJAzGnWx_b2_l3xyIJUF-RCI5FzRsMtt8KTO9ekqOXhmcesehcuBnPN6dzjM_P153GaYeJZir_hxEysu3a4m_6ht29441dJcop71K57KBWFAaMEiaLYV1S95CX_OlJGupO6Rghxfq9hb5B9_qDm3bqBO492B3Z0KTVjG5p-XS7YgGOn5aLQCEabWVctE8wkMnfSrYPXw9mPFbxqEk_IazIDJyPxLXB15LoOS6W2UQduZjeCK7G1T2gyovNeznrV9PWiZeaUOHi3A'
    },
    params: {
      reference_id: "1233",
      last_updated_from_date_time:"2018-12-01T20:28:37+01:00"
    }
  };

  axios.get(app_url,axiosConfig)
  .then((response) => {
    console.log("RESPONSE RECEIVED: ", response);
    res.send(response.data);
  })
  .catch((err) => {
    console.log("AXIOS ERROR: ", err);
  })
}

exports.managementBoard = (req, res) => {
	User.findOne({
		where: {id: req.userId},
		attributes: ['name', 'username', 'email'],
		include: [{
			model: Role,
			attributes: ['id', 'name'],
			through: {
				attributes: ['userId', 'roleId'],
			}
		}]
	}).then(user => {
		res.status(200).json({
			"description": "Management Board",
			"user": user
		});
	}).catch(err => {
		res.status(500).json({
			"description": "Can not access Management Board",
			"error": err
		});
	})
}