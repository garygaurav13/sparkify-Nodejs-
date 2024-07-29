const { chat_rooms, chat_messages } = require("../database/db");
const response = require("../utils/http-response");
const CONSTANT = require("../constant/config");
module.exports = async (req, res, next) => {
  const room_id = req.body.room_id ?? "";
  const last_message_id = req.body.last_message_id ?? "";

  const whereCondition = {
    chat_room_id: room_id,
  };

  const room_exist = await chat_rooms.findOne({
    where: whereCondition,
  });

  let error = false;

  // Check if room ID is missing or invalid
  if (!room_id || room_exist === null) {
    error = true;
  }

  // If last_message_id is provided, check its existence
  if (last_message_id) {
    whereCondition.message_id = last_message_id;
    const message_exist = await chat_messages.findOne({
      where: whereCondition,
    });

    // If the message doesn't exist, set the error flag
    if (message_exist === null) {
      error = true;
    }
  }

  // If there is an error, send an appropriate response
  if (error) {
    response.send_json(
      res,
      false,
      "Invalid chat room id",
      CONSTANT.HTTP_SUCCESS
    );
    return;
  }

  // Store the room_exist in the request for future use
  req.room_info = room_exist;

  next();
};
