module.exports = (sequelize_connect, DataType) => {
    const Generation = sequelize_connect.define("generations", {
      id: {
        type: DataType.INTEGER,
        FIRST: "id",
        primaryKey: true,
        autoIncrement: true,
      },
      value: {
        type: DataType.STRING,
        AFTER: "id",
        allowNull: true,
      },
      title: {
        type: DataType.STRING,
        AFTER: "value",
        allowNull: true,
      },
     
    }); 
  
    return Generation;
  };