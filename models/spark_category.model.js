module.exports = (sequelize_connect, DataType) => {
  const Spark_Category = sequelize_connect.define(
    "spark_categories",
    {
      id: {
        type: DataType.INTEGER,
        FIRST: "id",
        primaryKey: true,
        autoIncrement: true,
      },     
      title: {
        type: DataType.STRING,
        AFTER: "spark_id",
        allowNull: false,
      },
      icon:{
        type: DataType.STRING,
        AFTER: "title",
        allowNull: true,
      },
      status:{
        type: DataType.ENUM("active", "inactive"),
        defaultValue: "active",
        allowNull: false,
      },
      serial_number:{
        type:DataType.INTEGER,
        allowNull: true,
      }     
    },
    {
      indexes: [
        {
          fields: ["id","title"],
          unique: true,
        },
      ],
    }
  );

  return Spark_Category;
};
