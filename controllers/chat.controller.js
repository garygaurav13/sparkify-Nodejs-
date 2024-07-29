require("dotenv").config();
const {
  sequelize_connect,
  users,
  chat_rooms,
  chat_messages,
  blocked_profile,
} = require("../database/db");
const { Op } = require("sequelize");
const response = require("../utils/http-response");
const CONSTANT = require("../constant/config");
const { v4: uuidv4 } = require("uuid");
const {
  chat_room_receiver_info,
  get_room_receiver,
  chat_room_messages,
} = require("../utils/helpers");
const { validationResult } = require("express-validator");

//create chat room
exports.create_room = async (req, res) => {
  try {
    const loggedInUser = res.user.user_id;
    const loggedInuserId = res.user.id;

    // check for valid receiver
    const receiver = req.body.receiver ?? "";
    const user_exist = await users.findOne({
      where: {
        user_id: receiver,
      },
    });

    // receiver is required
    if (!receiver || user_exist === null) {
      response.send_json(
        res,
        false,
        "Invalid receiver id",
        CONSTANT.HTTP_SUCCESS
      );
      return;
    }

    let search_chat_room, room_msg, room_new;

    search_chat_room = await chat_room_receiver_info(loggedInUser, receiver);

    // if no chat room found
    if (search_chat_room === null) {
      //blocked or not
      var receiverBlocked = await blocked_profile.findOne({
        where: { userId: loggedInuserId, blocked_user_id: receiver },
      });
      var receiverId = await users.findOne({ where: { user_id: receiver } });
      var loggedinBlocked = await blocked_profile.findOne({
        where: { userId: receiverId.id, blocked_user_id: loggedInUser },
      });
      if (!!receiverBlocked || !!loggedinBlocked) {
        response.send_json(
          res,
          false,
          "You can't initiate chat with this user",
          CONSTANT.HTTP_SUCCESS
        );
        return;
      }

      //end
      await chat_rooms.create({
        chat_room_id: uuidv4(),
        chat_room_users: `${loggedInUser},${receiver}`,
      });
      room_msg = "New room created";
      room_new = true;
      search_chat_room = await chat_room_receiver_info(loggedInUser, receiver);
    } else {
      room_msg = "Existing room ID";
      room_new = false;
    }

    // send room info
    response.send_json(res, true, room_msg, CONSTANT.HTTP_SUCCESS, {
      isRoomNew: room_new,
      ...search_chat_room,
    });
  } catch (err) {
    response.send_json(res, true, err.message, CONSTANT.HTTP_SERVER_ERROR);
  }
};

// user chat rooms
exports.get_chat_rooms = async (req, res) => {
  try {
    const loggedInUser = res.user.user_id;

    const search = req.body.search;

    const all_chat_rooms = await chat_room_receiver_info(
      loggedInUser,
      null,
      "all"
    );

    // converting room users in list
    let modified_chat_rooms = all_chat_rooms.map((obj) => ({
      ...obj.dataValues,
      chat_room_users: obj.chat_room_users.split(","),
    }));

    // if search found in request filter records based on full name
    if (search) {
      const searchVariable = search;
      modified_chat_rooms = modified_chat_rooms.filter((record) => {
        const fullName = record.full_name.toLowerCase();
        return fullName.includes(searchVariable.toLowerCase());
      });
    }

    // sending response
    response.send_json(
      res,
      true,
      "User chat rooms",
      CONSTANT.HTTP_SUCCESS,
      modified_chat_rooms
    );
  } catch (err) {
    response.send_json(res, false, err.message, CONSTANT.HTTP_SERVER_ERROR);
  }
};

// temporary chat room all messages
exports.get_chat_rooms_all_messages = async (req, res) => {
  try {
    const loggedInUser = res.user.user_id;
    const room_data = req.room_info;
    const chat_room_id = room_data.chat_room_id;

    // removing logged in user ID
    const receiver = get_room_receiver(room_data.chat_room_users, loggedInUser);
    const receiverInfo = await chat_room_receiver_info(loggedInUser, receiver);

    // fetching all room messages
    let attributes = [
      "message_id",
      "type",
      "message",
      "created_at",
      "sender_id",
      [
        sequelize_connect.literal(
          `(SELECT avatar FROM users WHERE user_id = chat_messages.sender_id)`
        ),
        "sender_avatar",
      ],
      "isDeleted",
    ];
    attributes = [...attributes, "deleted_at"];
    const room_messages = (results = await chat_messages.findAll({
      where: {
        chat_room_id,
      },
      attributes: attributes,
    }));
    //console.log('mesage count',room_messages.length);

    // getting few fields from data
    const { name, user_id, avatar, chat_room_status, chat_room_users } =
      receiverInfo;

    // preparind data to send in response
    const responseData = {
      chat_room_id,
      chat_room_status,
      chat_room_users: chat_room_users.split(","),
      receiver: { user_id, name, avatar },
      messages: room_messages,
    };

    // send response
    response.send_json(
      res,
      true,
      `chat room details fetched successfully.`,
      CONSTANT.HTTP_SUCCESS,
      responseData
    );
  } catch (err) {
    response.send_json(res, false, err.message, CONSTANT.HTTP_SERVER_ERROR);
  }
};

// chat room message
exports.get_chat_rooms_messages = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      response.send_json(res, false, null, CONSTANT.HTTP_SUCCESS, {
        errors: errors.array(),
      });
      return;
    }
    const loggedInUser = res.user.user_id;
    const room_data = req.room_info;
    const chat_room_id = room_data.chat_room_id;

    // removing logged in user ID
    const receiver = get_room_receiver(room_data.chat_room_users, loggedInUser);
    const receiverInfo = await chat_room_receiver_info(loggedInUser, receiver);

    // last message for pagination
    const last_message_id = req.body.last_message_id;

    let isPaginate = false;
    let msg_count = null;

    if (!last_message_id) {
      msg_count = await chat_messages.count({
        where: {
          chat_room_id,
        },
      });
    } else {
      const prevRecordsCount = await chat_messages.count({
        where: {
          chat_room_id,
          cm_id: {
            [Op.lt]: sequelize_connect.literal(
              `(SELECT cm_id FROM chat_messages WHERE message_id = '${last_message_id}')`
            ),
          },
        },
      });

      // if previous messages count is > then no of messages
      if (prevRecordsCount > CONSTANT.NO_OF_MESSAGES_TO_RETRIEVE) {
        isPaginate = true;
      }
    }

    // fetching all room messages
    const messages = await chat_room_messages(
      chat_room_id,
      "all",
      "",
      last_message_id
    );

    // getting few fields from data
    const { name, user_id, avatar, chat_room_status, chat_room_users } =
      receiverInfo;

    // preparind data to send in response
    const responseData = last_message_id
      ? {
          isPaginate,
          messages,
        }
      : {
          chat_room_id,
          chat_room_status,
          chat_room_users: chat_room_users.split(","),
          receiver: { user_id, name, avatar },
          msg_count,
          messages,
        };

    // send response
    response.send_json(
      res,
      true,
      `chat room details fetched successfully.`,
      CONSTANT.HTTP_SUCCESS,
      responseData
    );
  } catch (err) {
    response.send_json(res, false, err.message, CONSTANT.HTTP_SERVER_ERROR);
  }
};

// create message
exports.create_message = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      response.send_json(res, false, null, CONSTANT.HTTP_SUCCESS, {
        errors: errors.array(),
      });
      return;
    }

    // user info > sender ID means logged in user
    const sender_id = res.user.user_id;
    const room_data = req.room_info;
    const chat_room_id = room_data.chat_room_id;
    //check if users blocked
    let roomStatus = await chat_rooms.findOne({where:{chat_room_id:chat_room_id}});
    if(roomStatus.chat_room_status != "active"){
      response.send_json(res, false, `You can't send message to this user`, CONSTANT.HTTP_SUCCESS);
      return; 
    }

    const receiver_id = get_room_receiver(room_data.chat_room_users, sender_id);
    //check for receiver is not blocked by admin
    const recIsBlockbyAdmin = await users.findOne({where:{user_id:receiver_id}});
    if(recIsBlockbyAdmin.status != "1"){
      response.send_json(res, false, `User is blocked by support team, you can't send message to this user.`, CONSTANT.HTTP_SUCCESS);
      return; 
    }
    const message = req.body.message;

    
    // message data
    const msg_data = {
      message_id: uuidv4(),
      sender_id,
      receiver_id,
      chat_room_id,
      message,
    };

    const createMessage = await chat_messages.create(msg_data);

    const room_message = await chat_room_messages(createMessage.message_id);

    // sending response
    response.send_json(
      res,
      true,
      `new message created.`,
      CONSTANT.HTTP_SUCCESS,
      { ...room_message }
    );
  } catch (err) {
    response.send_json(res, false, err.message, CONSTANT.HTTP_SUCCESS);
  }
};

// delete chat rooms
exports.delete_room_message = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      response.send_json(res, false, null, CONSTANT.HTTP_SUCCESS, {
        errors: errors.array(),
      });
      return;
    }

    const sender_id = res.user.user_id;

    const { message_id, room_id } = req.body;

    // condition
    const where = {
      message_id,
      sender_id,
      chat_room_id: room_id,
    };

    // check message sender,room is valid
    const message_exist = await chat_messages.findOne({
      where: where,
    });

    // no message found
    if (message_exist === null) {
      response.send_json(
        res,
        false,
        "Invalid message id",
        CONSTANT.HTTP_SUCCESS
      );
      return;
    }

    // message data
    const msg_data = {
      message: null,
      isDeleted: 1,
      deleted_at: sequelize_connect.literal("CURRENT_TIMESTAMP"),
    };

    // update message
    await chat_messages.update(msg_data, {
      where: where,
    });

    // delete message info
    const room_message = await chat_room_messages(message_id, "", "delete");

    // sending response
    response.send_json(
      res,
      true,
      `message deleted successfully.`,
      CONSTANT.HTTP_SUCCESS,
      { ...room_message }
    );
  } catch (err) {
    response.send_json(res, false, err.message, CONSTANT.HTTP_SERVER_ERROR);
  }
};


exports.location = async (req,res) => {
  try {
    console.log("Welcome to the Ghostland!!!");
  } catch (err) {
    response.send_json(res,false, err, CONSTANT.email.HTTP_SERVER_ERROR);
  }
}