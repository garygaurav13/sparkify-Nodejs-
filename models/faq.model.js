module.exports = (sequelize_connect, DataType) => {  
    const Faq = sequelize_connect.define("faqs", {
      id: {
        type: DataType.INTEGER,
        FIRST: "id",
        primaryKey: true,
        autoIncrement: true,
      },
      question: {
        type: DataType.STRING,
        AFTER: "id",
        allowNull: false,
       
      },
      answer: {
        type: DataType.TEXT,
        AFTER: "question",
        allowNull: false,
      },
      status: {
        type:DataType.ENUM("active","inactive"),
        defaultValue:"active",
        AFTER: "answer",        
      }
      
    });
    
    return Faq;
  };