module.exports = (sequelize_connect, DataType) => {
  const reset_token = sequelize_connect.define("reset_tokens", {
    id: {
      type: DataType.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataType.STRING,
      allowNull: true,
    },
    token: {
      type: DataType.STRING,
      allowNull: true,
    },
    expiration: {
      type: DataType.DATE,
      allowNull: true,
    },
    used: {
      type: DataType.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });

  return reset_token;
};
