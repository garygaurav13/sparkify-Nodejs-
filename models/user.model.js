module.exports = (sequelize_connect, DataType) => {
  const moment = require('moment');
  const User = sequelize_connect.define("users", {

    id: {
      type: DataType.INTEGER,
      FIRST:"id",
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataType.STRING,
      AFTER:"id",      
      allowNull: false,
    },  
    email: {
      type: DataType.STRING,
      AFTER:"user_id",      
      allowNull: false,     
      validate:{           
        isEmail: true,              
        notEmpty: true,       
      }
    },
    password:{
      type: DataType.STRING,
      AFTER:"email",
      allowNull: false,
      validate:{               
        notEmpty: true
      }     
           
    },
    avatar:{
      type: DataType.STRING,
      AFTER:"user_id",
      allowNull: true,                 
    },   
    firstname:{
      type: DataType.STRING,
      AFTER:"avatar",
      allowNull: true,                 
    },
    lastname:{
      type: DataType.STRING,
      AFTER:"firstname",
      allowNull: true,                 
    },
    occupation:{
      type: DataType.STRING,
      AFTER:"lastname",
      allowNull: true,                 
    },
    zipcode:{
      type: DataType.INTEGER,
      AFTER:"occupation",
      allowNull: true,                 
    },
    formatted_address:{
      type: DataType.STRING,
      AFTER:"zipcode",
      allowNull: true,                 
    },
    generation:{
      type: DataType.STRING,
      AFTER:"zipcode",
      allowNull: true,                 
    },
    birthdate:{
      type: DataType.DATE,
      AFTER:"generation",
      allowNull: true, 
     get(){
      const rawValue = this.getDataValue('birthdate');
      if(rawValue){
        return moment(rawValue).format('MM-DD');
      }else{
        return null;
      }
     
     }           
    },     
    status: {
      type: DataType.ENUM('0', '1', '2','3'),        
      AFTER:"birthdate",     
       defaultValue: "1",
       comment:'0=inactive,1=active,archieve=2,delete=3 managed by admin'
    },
    account_status: {
      type: DataType.INTEGER,
      AFTER:"status",  
      defaultValue: 1,
      comment:'1=active,0=hidden managed by user'
    },
    is_profile_completed: {
      type: DataType.ENUM("0", "1"),
      defaultValue: "0",
      AFTER:"account_status",  
      comment: '1 means profile completed',
    },
    sign_up_type: {
      type: DataType.STRING,
      defaultValue: "normal",
      AFTER:"is_profile_completed",  
    },
    isActive: {
      type: DataType.BOOLEAN,
      defaultValue: true,
      AFTER:"sign_up_type", 
      comment : '1 means active 0 means blocked by admin'
    },
    isVerified: {
      type: DataType.BOOLEAN,
      defaultValue: false,
      AFTER:"isActive",
    },
    last_login:{
      type:DataType.DATE,
      AFTER:"isVerified",
      allowNull: true, 
    },
    birthday: {
      type: DataType.STRING,
      AFTER:"last_login",
      allowNull: true     
    },
    birthmonth: {
      type: DataType.STRING,
      AFTER:"birthday",
      allowNull: true     
    },
  },{
    indexes: [
        {
          fields: ['id','email','user_id'],
          unique: true
        }
    ]
});
  return User;
};
