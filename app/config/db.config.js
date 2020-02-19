const env = require('./env.js');
 
const Sequelize = require('sequelize');
const sequelize = new Sequelize(env.database, env.username, env.password, {
  host: env.host,
  dialect: env.dialect,
  logging: false,
  freezeTableName: true,
  pool: {
    max: env.max,
    min: env.pool.min,
    acquire: env.pool.acquire,
    idle: env.pool.idle
  }
});
 
const db = {};
 
db.Sequelize = Sequelize;
db.sequelize = sequelize;
 
db.user = require('../model/User.model.js')(sequelize, Sequelize);
db.request_log = require('../model/RequestLog.model.js')(sequelize, Sequelize);
db.booking_failed_log = require('../model/BookingFailed.model.js')(sequelize, Sequelize);
db.booking_log = require('../model/BookingLog.model.js')(sequelize, Sequelize);
db.drawer_log = require('../model/DrawerLog.model.js')(sequelize, Sequelize);
db.role = require('../model/Role.model.js')(sequelize, Sequelize);
db.order = require('../model/Order.model.js')(sequelize, Sequelize);
db.order_cancel = require('../model/OrderCancel.model.js')(sequelize, Sequelize);
db.city_cost = require('../model/CityCost.model.js')(sequelize, Sequelize);
db.staff = require('../model/Staff.model.js')(sequelize, Sequelize);
db.webhook_status = require('../model/WebhookStatus.model.js')(sequelize, Sequelize);
db.response_log = require('../model/ResponseLog.model.js')(sequelize, Sequelize);
db.device = require('../model/Device.model.js')(sequelize, Sequelize);
 
db.role.belongsToMany(db.user, { through: 'user_roles', foreignKey: 'roleId', otherKey: 'userId'});
db.user.belongsToMany(db.role, { through: 'user_roles', foreignKey: 'userId', otherKey: 'roleId'});
module.exports = db;