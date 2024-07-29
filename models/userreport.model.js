module.exports = (sequelize_connect, DataType) => {
  
    const Userreport= sequelize_connect.define("userreports", {     
      id: {
        type: DataType.INTEGER,
        FIRST: "id",
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {    
        AFTER: "id",
        type: DataType.INTEGER,
            allowNull: false,
      },
      reported_user_id: {
        type: DataType.STRING,
        AFTER: "userId",
        allowNull: false,
       
      },
      message:{
        type: DataType.STRING,
        AFTER: "reported_user_id",
        allowNull: true,
      },
      
      isVisible:{
        type:DataType.ENUM("0","1"),
        defaultValue:"1",
        AFTER: "sparkListId",
        comment:"0=hidden,1=visible managed by user"
      }
    });
  
    return Userreport;
  };
  