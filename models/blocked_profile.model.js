module.exports = (sequelize_connect, DataType) => {  
  
  const Blocked_Profile = sequelize_connect.define("blocked_profiles", {
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
    blocked_user_id: {
      type: DataType.STRING,
      AFTER: "userId",
      allowNull: true,
    },
  });

  return Blocked_Profile;
};
