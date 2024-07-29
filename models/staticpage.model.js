module.exports = (sequelize_connect, DataType) => {  
    const StaticPage = sequelize_connect.define("static_pages", {
      id: {
        type: DataType.INTEGER,
        FIRST: "id",
        primaryKey: true,
        autoIncrement: true,
      },
      page_name: {
        type: DataType.STRING,
        AFTER: "id",
        allowNull: false,
       
      },
      content: {
        type: DataType.TEXT,
        AFTER: "question",
        allowNull: false,
      },
      status: {
        type:DataType.ENUM("active","inactive"),
        defaultValue:"active",
        AFTER: "answer",        
      },
      type: {
        type: DataType.STRING,
        AFTER: "status",
        allowNull: false,       
      },
      page_url: {
        type: DataType.STRING,
        AFTER: "type",
        allowNull: false,       
      }      
    });
    
    return StaticPage;
  };