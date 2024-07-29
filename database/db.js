const env = process.env.NODE_ENV || "development";
const constant = require('../constant/config');
const sequelize = require("sequelize");
const sequelize_connect = new sequelize(constant[env]['database']['DB'], constant[env]['database']['USER'], constant[env]['database']['PASSWORD'], {
  host: constant[env]['database']['HOST'],
  dialect: constant[env]['database']['dialect'],
  dialectOptions: {
    connectTimeout: 60000
  },
  //logging:false

});
const db = {};


db.sequelize = sequelize;
db.sequelize_connect = sequelize_connect;

db.users = require("../models/user.model")(sequelize_connect,sequelize);
db.spark_category = require("../models/spark_category.model")(sequelize_connect,sequelize);
db.spark_list = require("../models/spark_list.model")(sequelize_connect,sequelize);
db.blocked_profile = require("../models/blocked_profile.model")(sequelize_connect,sequelize);
db.favourite = require("../models/favourite.model")(sequelize_connect,sequelize);
db.user_spark = require("../models/user_spark.model")(sequelize_connect,sequelize);
db.reset_token = require("../models/reset_token.model")(sequelize_connect,sequelize);
db.chat_rooms = require("../models/chatrooms.model")(sequelize_connect,sequelize);
db.chat_messages = require("../models/chatmessages.model")(sequelize_connect,sequelize);
db.generation = require("../models/generation.model")(sequelize_connect,sequelize);
db.geolocation = require("../models/geolocation.model")(sequelize_connect,sequelize);
db.userreport = require("../models/userreport.model")(sequelize_connect,sequelize);
db.faq = require("../models/faq.model")(sequelize_connect,sequelize);
db.staticpage = require("../models/staticpage.model")(sequelize_connect,sequelize);
db.app_settings = require("../models/app_setting.model")(sequelize_connect,sequelize);

db.spark_category.hasMany(db.spark_list);
db.spark_list.belongsTo(db.spark_category,{onDelete:"cascade",foreignKey: { allowNull: false }});
db.users.hasMany(db.blocked_profile);
db.users.hasMany(db.favourite);
db.users.hasMany(db.user_spark,{as:'sparks',foreignKey:"userId"});



db.user_spark.belongsTo(db.users, {onDelete:"cascade",foreignKey: 'userId',as:"user_sparks"});
// db.user_spark.belongsTo(db.spark_category, {onDelete:"cascade",foreignKey: 'sparkCategoryId',as:"category"});
// db.user_spark.belongsTo(db.spark_list, {onDelete:"cascade",foreignKey: 'sparkListId',as:"subcategory"});
// db.users.belongsToMany(db.spark_category, { through: db.user_spark,as:"category"});
// db.users.belongsToMany(db.spark_list, { through: db.user_spark,as:"categoryList" });

module.exports = db;