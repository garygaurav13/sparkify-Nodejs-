module.exports = (sequelize_connect, DataType) => {
    const Favourite = sequelize_connect.define("favourites", {
      id: {
        type: DataType.INTEGER,
        FIRST: "id",
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataType.INTEGER,
        AFTER: "id",
        allowNull: false,
      },
      favourite_user_id: {
        type: DataType.STRING,
        AFTER: "userId",
        allowNull: false,
      },
    });  
    return Favourite;
  };
  