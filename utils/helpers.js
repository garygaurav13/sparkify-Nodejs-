const {
  users,
  blocked_profile,
  sequelize_connect,
  user_spark,
  chat_rooms,
  chat_messages
} = require("../database/db");
const { Op } = require("sequelize");
const CONSTANT = require("../constant/config");

// filter matching and non matching users sparks
exports.get_users_sparks = (jsonArray) => {
  const matchingIds = new Set();
  const nonMatchingTitles = new Set();
  const uniqueIds = new Set();

  for (let i = 0; i < jsonArray.length; i++) {
    const currentItem = jsonArray[i];
    const subCategoryId = currentItem.subcategory.id;
    const title = currentItem.subcategory.title;

    if (uniqueIds.has(subCategoryId)) {
      matchingIds.add(subCategoryId);
      nonMatchingTitles.delete(title);
    } else {
      nonMatchingTitles.add(title);
      uniqueIds.add(subCategoryId);
    }
  }

  const matchingTitles = [];
  for (const id of matchingIds) {
    const matchingItem = jsonArray.find((item) => item.subcategory.id === id);
    matchingTitles.push(matchingItem.subcategory.title);
  }

  return {
    matchingTitles,
    nonMatchingTitles: Array.from(nonMatchingTitles),
  };
};

// Function to generate a random string of given length
exports.generateRandomString = (length = 50) => {
  const characters = "0123456789abcdef";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
};

// check user valid
const getUserByIdAndCriteria = async (userId, criteria) => {
  return await users.findOne({
    where: {
      [Op.or]: [{ id: userId }, { user_id: userId }],
      ...criteria,
    },
    attributes: ["user_id", "is_profile_completed", "isActive", "status"],
  });
};

exports.is_user_valid = async (
  current_uid,
  specific_user_id = null,
  attribute = null
) => {
  try {
    // Check if current_uid is provided
    if (!current_uid) {
      return null;
    }

    // user valid criteria
    const userValidCriteria = {
      is_profile_completed: "1",
      isActive: 1,
      status: "1",
    };

    // If specific_user_id is provided
    if (specific_user_id) {
      const specificUser = await getUserByIdAndCriteria(
        specific_user_id,
        userValidCriteria
      );

      // If the specific user meets the criteria and is not blocked, return the user
      if (specificUser) {
        const blockedProfile = await blocked_profile.findOne({
          where: {
            userId: current_uid,
            blocked_user_id: specific_user_id,
          },
        });

        // If the specific user is blocked, return null; otherwise, return the user
        return blockedProfile ? null : specificUser;
      } else {
        return null;
      }
    } else {
      // find all users that meet the specified criteria
      const blockedUserIds = await blocked_profile.findAll({
        where: { userId: current_uid },
        attributes: ["blocked_user_id"],
      });

      // Extract the blocked_user_id values from the result
      const blockedIds = blockedUserIds.map(
        (blockedUser) => blockedUser.blocked_user_id
      );

      // Find all users that meet criteria and not blocked by the current user
      const all_valid_users = await users.findAll({
        where: {
          ...userValidCriteria,
          id: {
            [Op.notIn]: blockedIds,
          },
        },
        attributes: attribute ?? [
          "user_id",
          "is_profile_completed",
          "isActive",
          "status",
        ],
      });
      return all_valid_users;
    }
  } catch (err) {
    throw new Error(err);
  }
};

// get room receiver based on logged in
exports.get_room_receiver = (chat_room_users, loggedInUser) => {
  if (!chat_room_users) return null;
  const chatUsers = chat_room_users;
  const regex = new RegExp(`\\b${loggedInUser}\\b,?`, "g");
  return chatUsers.replace(regex, "").replace(/(^,)|(,$)/g, "");
};

// receiver info
exports.chat_room_receiver_info = async (
  loggedInUser,
  receiver = null,
  type = ""
) => {
  try {
    const room_sql = `from chat_messages where chat_room_id = chat_rooms.chat_room_id AND isDeleted <> 1 ORDER BY created_at DESC LIMIT 1`;

    const remove_current_user = `TRIM(BOTH ',' FROM REPLACE(CONCAT(',', chat_room_users, ','), CONCAT(',', '${loggedInUser}', ','), ','))`;

    const user_sql = `from users where user_id=${remove_current_user}`;

    let results;

    const attributes = [
      "chat_room_id",
      [
        sequelize_connect.literal(
          `(SELECT TRIM(CONCAT(firstname, ' ', SUBSTRING(COALESCE(lastname, ''),1,1))) ${user_sql})`
        ),
        "name",
      ],
      [
        sequelize_connect.literal(
          `(SELECT TRIM(CONCAT(firstname, ' ', COALESCE(lastname, ''),1,1)) ${user_sql})`
        ),
        "full_name",
      ],
      "chat_room_status",
      "chat_room_users",
      [sequelize_connect.literal(`${remove_current_user}`), "user_id"],
      [sequelize_connect.literal(`(SELECT avatar ${user_sql})`), "avatar"],
      [
        sequelize_connect.literal(`(SELECT message ${room_sql})`),
        "last_message",
      ],
      [
        sequelize_connect.literal(`(SELECT created_at ${room_sql})`),
        "last_message_time",
      ],
    ];

    if (type == "") {
      results = await chat_rooms.findOne({
        attributes: attributes,
        where: sequelize_connect.literal(
          `FIND_IN_SET('${loggedInUser}', chat_room_users) AND FIND_IN_SET('${receiver}', chat_room_users)`
        ),
        raw: true,
      });
    } else {
      results = await chat_rooms.findAll({
        attributes: attributes,
        where: {
          chat_room_users: {
            [Op.like]: `%${loggedInUser}%`,
          },
        },
        order: [
          [
            sequelize_connect.literal(`(SELECT created_at ${room_sql})`),
            "DESC",
          ],
        ],
      });
    }
    return results;
  } catch (err) {
    throw new Error(err);
  }
};

// query room messages
exports.chat_room_messages = async (m_id, type = "", op = "", specificMessageId='') => {
  try {
    let results;
    let prev_msg=null;
    const timestamp = op == "" ? "created_at" : "deleted_at";

    const numberOfMessagesToRetrieve = CONSTANT.NO_OF_MESSAGES_TO_RETRIEVE;

    let attributes = [
      "message_id",
      "type",
      "message",
      timestamp,
      "sender_id",
      [
        sequelize_connect.literal(
          `(SELECT avatar FROM users WHERE user_id = chat_messages.sender_id)`
        ),
        "sender_avatar",
      ],
      "isDeleted"
    ];

    // query single message
    if (type == "") {
      // if request is delete
      if (op != "") {
        attributes = [...attributes, "chat_room_id"];
        results = await chat_messages.findOne({
          where: { message_id: m_id },
          attributes: attributes,
          raw: true,
        });

        // check if the message is the last one
        const lastMessageInRoom = await chat_messages.findOne({
          where: { chat_room_id: results.chat_room_id },
          attributes: attributes,
          order: [["created_at", "DESC"]],
          raw: true,
        });

        const isLastMessage =
          lastMessageInRoom.message_id === results.message_id;

        if (isLastMessage) {
          const lastMesageInRoom = await chat_messages.findOne({
            where: {
              chat_room_id: results.chat_room_id,
              isDeleted: 0,
            },
            order: [["created_at", "DESC"]],
            attributes: ["message","created_at"],
            raw: true
          });
          
          results = {
            ...results,
            islastMessage: true,
            prev_msg : lastMesageInRoom
          };
        } else {
          results = {
            ...results,
            islastMessage: false,
            prev_msg
          };
        }

        // Remove "chat_room_id" from the results object
        const { chat_room_id, ...finalResults } = results;
        results = finalResults;
      } else {
        results = await chat_messages.findOne({
          where: { message_id: m_id },
          attributes: attributes,
          raw: true,
        });
      }
    } else {
      // fetching all message with pagination
      const paginate = {
        chat_room_id: m_id,
        ...specificMessageId ? {
          cm_id: {
            [Op.lt]: sequelize_connect.literal(
              `(SELECT cm_id FROM chat_messages WHERE message_id = '${specificMessageId}')`
            ),
          }
        } : {}
      };

      // adding column in attributes
      attributes = [...attributes, "deleted_at"];
      results = await chat_messages.findAll({
        where: paginate,
        attributes: attributes,
        limit: numberOfMessagesToRetrieve,
        order : [['cm_id', "desc"]]
      });
    }
    return results;
  } catch (err) {
    throw new Error(err);
  }
};

//get count of matched and non matched sparks
exports.matchCount = async (loginUser, OtherUsers) => {
  try {
    if (loginUser != null && OtherUsers.length > 0) {
      const userID = await users.findOne({
        attributes: ["id"],
        where: { user_id: loginUser },
      });
      const otherID = await users.findOne({
        attributes: ["id"],
        where: { user_id: OtherUsers },
      });

      //login user id
      var loginuID = userID.dataValues.id;
      //searched user ids
      var serachIDS = otherID.dataValues.id;
      var loginuserSpark = await user_spark.findAll({
        attributes: ["sparkListId"],
        where: { userId: loginuID},
      });
      var otheruserSpark = await user_spark.findAll({
        attributes: ["sparkListId"],
        where: { userId: serachIDS },
      });
      var sparkLoginID = [];
      for (const all of loginuserSpark) {
        sparkLoginID.push(all.sparkListId);
      }
      var sparotherID = [];
      for (const all of otheruserSpark) {
        sparotherID.push(all.sparkListId);
      }
      if (sparotherID.length > 0) {
        let difference = sparkLoginID.filter(
          (x) => !sparotherID.includes(x)
        ).length;
        let common = sparkLoginID.filter((x) => sparotherID.includes(x)).length;
        var data = {
          commonspark: common,
          uncommon: difference,
        };
      } else {
        var data = {
          commonspark: 0,
          uncommon: 0,
        };
      }

      return data;
    } else {
      return null;
    }
  } catch (err) {
    response.send_json(res, false, err, 500);
  }
};


