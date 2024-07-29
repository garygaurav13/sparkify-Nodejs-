module.exports = (sequelize_connect, DataType) => {
  
    const User_Spark = sequelize_connect.define("user_sparks", {     
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
      sparkCategoryId: {
        type: DataType.INTEGER,
        AFTER: "userId",
        allowNull: false,
       
      },
      sparkListId: {
        type: DataType.INTEGER,
        AFTER: "sparkCategoryId",
        allowNull: false,
        
      },
      isVisible:{
        type:DataType.ENUM("0","1"),
        defaultValue:"1",
        AFTER: "sparkListId",
        comment:"0=hidden,1=visible managed by user"
      }
    });
  
    return User_Spark;
  };
  