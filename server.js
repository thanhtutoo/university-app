const morgan = require('morgan');
const winston = require('./winston/config');
const express = require('express');
const app = express();
// const bodyParser = require('body-parser');
var stream = require('stream');
require('dotenv').config();
var ua = require('universal-analytics');
// app.use(bodyParser.json())

// var visitor = ua('UA-87424006-3');
// var visitor = ua('UA-87424006-3', {http: true});

// visitor.pageview("/testtest").send();
// visitor.pageview("/api/booking").send();
// visitor.pageview("/api/booking/cancel").send();
// visitor.pageview("/api/convertbooking").send();


// app.use(bodyParser.urlencoded({
//   extended: true
// }));
// app.use(bodyParser.urlencoded())
// app.use(bodyParser.urlencoded({ extended: true }));

// app.use(bodyParser.json());

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies


process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
require('./app/router/router.js')(app);
const config = require('./app/config/config.js');

const db = require('./app/config/db.config.js');

const Role = db.role;
app.use(morgan('combined', { "stream": winston.stream.write}));
// Create a Server
const server = app.listen(config.port, function () {
 
  const host = server.address().address
  const port = server.address().port
 
  console.log("App listening at http://%s:%s", host, port)
})



