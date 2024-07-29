module.exports = (sequelize_connect, DataType) => {  
  const Spark_List = sequelize_connect.define(
    "spark_list",
    {
      id: {
        type: DataType.INTEGER,
        FIRST: "id",
        primaryKey: true,
        autoIncrement: true,
      },
      sparkCategoryId: {
        type: DataType.INTEGER,
        AFTER: "id",
        allowNull: false,                
        
      },
      title: {
        type: DataType.STRING,
        AFTER: "spark_id",
        allowNull: false,
      },
      status:{
        type: DataType.ENUM("active", "inactive"),
        AFTER: "title",
        defaultValue: "active",
        allowNull: false,
      }
    },
    {
      indexes: [
        {
          fields: ["id", "title"],
          unique: true,
        },
      ],
    }
  );
 
 
  return Spark_List;
};
