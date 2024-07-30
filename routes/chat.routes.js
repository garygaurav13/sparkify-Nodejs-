module.exports = (app) => {
  const chat = require("../controllers/chat.controller");
  const isAuthorise = require("../middleware/auth");
  const validChatRoom = require("../middleware/validateChatRoom");
  const { check } = require("express-validator");

  var router = require("express").Router();

  //create room
  router.post("/create_room", isAuthorise, chat.create_room);

  // query loggedIn user chat rooms
  router.get("/chat_rooms", isAuthorise, chat.get_chat_rooms);

  // query loggedIn user all chats rooms temporary remove
  router.post(
    "/chat_rooms_all_messages/",
    isAuthorise,
    validChatRoom,
    chat.get_chat_rooms_all_messages
  );

  // query loggedIn user chat rooms
  router.post(
    "/chat_rooms_messages/",
    [
      check("last_message_id").notEmpty().optional().withMessage("Last message is required")
    ],
    isAuthorise,
    validChatRoom,
    chat.get_chat_rooms_messages
  );

  // create message
  router.post(
    "/create_message",
    [
      check("room_id").notEmpty().withMessage("Room ID is required"),
      check("message").notEmpty().withMessage("Message is required"),
    ],
    isAuthorise,
    validChatRoom,
    chat.create_message
  );

  //delete room message
  router.post("/delete_message/", [
    check("room_id").notEmpty().withMessage("Room ID is required"),
    check("message_id").notEmpty().withMessage("Message ID is required"),
  ],
  isAuthorise, chat.delete_room_message);

  // calling blocked endpoint using router
  app.use("/api/chat", router);
};
