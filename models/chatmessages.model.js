module.exports = (sequelize_connect, DataType) => {
  const chat_messages = sequelize_connect.define(
    "chat_messages",
    {
      cm_id: {
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      message_id : {
        type: DataType.STRING
      },
      sender_id: {
        type: DataType.STRING
      },
      receiver_id: {
        type: DataType.STRING
      },
      chat_room_id: {
        type: DataType.STRING
      },
      message: {
        type: DataType.TEXT
      },
      isDeleted : {
        type: DataType.BOOLEAN,
        defaultValue: 0,
        comment : '1 means delete 0 means not deleted'
      },
      type : {
        type: DataType.ENUM("text", "video", "image", "location"),
        defaultValue: "text",
        AFTER:"account_status"
      },
      deleted_at: {
        type: DataType.DATE,
        allowNull: true
      },
      created_at: {
        type: DataType.DATE,
        defaultValue: DataType.literal("CURRENT_TIMESTAMP")
      },
    }, 
    {
      timestamps: false
    }
  );
  return chat_messages;
};
