module.exports = (sequelize_connect, DataType) => {  
    const App_Settings = sequelize_connect.define("app_settings", {
      id: {
        type: DataType.INTEGER,
        FIRST: "id",
        primaryKey: true,
        autoIncrement: true,
      },
      radius: {
        type: DataType.INTEGER,
        AFTER: "id",
        allowNull: true,
       
      },
      time: {
        type: DataType.INTEGER,
        AFTER: "radius",
        allowNull: true,
        Comment:"time sholud be in minutes"
      },
      limit: {
        type: DataType.INTEGER,
        AFTER: "time",
        allowNull: true,
      },
      status: {
        type:DataType.ENUM("active","inactive"),
        defaultValue:"active",
        AFTER: "limit",        
      }
      
    });
    
    return App_Settings;
  };