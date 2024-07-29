module.exports = (sequelize_connect, DataType) => {
  const chat_rooms = sequelize_connect.define(
    "chat_rooms",
    {
      cr_id: {
        type: DataType.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      chat_room_id: {
        type: DataType.STRING
      },
      chat_room_name: {
        type: DataType.STRING,
        allowNull: true,
      },
      chat_room_users: {
        type: DataType.TEXT
      },
      is_group_chat: {
        type: DataType.TINYINT(2),
        defaultValue: 0,
      },
      chat_room_status : {
        type: DataType.ENUM("active", "Inactive","deleted","blocked"),
        defaultValue: "active"
      },
      last_message_time : {
        type: DataType.DATE,
      },
      last_message : {
        type: DataType.STRING
      },
      initiater: {
        type: DataType.BIGINT,
      },
      created_at: {
        type: DataType.DATE,
        defaultValue: DataType.literal('CURRENT_TIMESTAMP')
      },
    },
    {
      timestamps: false
    }
  );
  return chat_rooms;
};
