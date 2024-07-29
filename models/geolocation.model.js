module.exports = (sequelize_connect, DataType) => {  
    const Geolocation = sequelize_connect.define("geolocations", {
      id: {
        type: DataType.INTEGER,
        FIRST: "id",
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataType.STRING,
        AFTER: "id",
        allowNull: true,
       
      },
      perm_place_id: {
        type: DataType.STRING,
        AFTER: "userId",
        allowNull: true,
      },
      perm_latitude: {
        type: DataType.STRING,
        AFTER: "perm_place_id",
        allowNull: true,
      },
      perm_longitude: {
        type: DataType.STRING,
        AFTER: "perm_place_id",
        allowNull: true,
      },
      perm_formatted_address: {
        type: DataType.STRING,
        AFTER: "perm_longitude",
        allowNull: true,
      },      
      live_latitude: {
        type: DataType.STRING,
        AFTER: "perm_formatted_address",
        allowNull: true,
      },
      live_longitude: {
        type: DataType.STRING,
        AFTER: "live_latitude",
        allowNull: true,
      },
      isVisible:{
        type:DataType.ENUM("0","1"),
        defaultValue:"1",
        AFTER: "live_longitude",
        comment:"0=hidden,1=visible managed by user"
      }
    });
    
    return Geolocation;
  };