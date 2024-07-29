require("dotenv").config();
const { users, blocked_profile, favourite, chat_rooms } = require("../database/db");
const response = require("../utils/http-response");
const CONSTANT = require("../constant/config");
const {
  chat_room_receiver_info,
  get_room_receiver,
  chat_room_messages,
} = require("../utils/helpers");

//get all blocked profile
exports.get = async (req, res) => {
  try {
    let ID = res.user.id;
    const blockData = await blocked_profile.findAll({ where: { userId: ID } });
    var userD = [];
    if (blockData) {
      for (const list of blockData) {
        const userdetail = await users.findOne({
          attributes: ["user_id", "firstname", "lastname", "avatar"],
          where: { user_id: list.blocked_user_id },
        });

        userD.push({
          firstname: userdetail.firstname,
          lastname: userdetail.lastname,
          avatar: userdetail.avatar,
          blocked_user_id: userdetail.user_id,
        });
      }
      response.send_json(
        res,
        true,
        `Retrieve all blocked profiles.`,
        CONSTANT.HTTP_SUCCESS,
        userD
      );
    } else {
      response.send_json(
        res,
        false,
        `Not found blocked profile.`,
        CONSTANT.HTTP_SUCCESS
      );
    }
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
  }
};

//block a profile
exports.create = async (req, res) => {
  try {
    let ID = res.user.id;
    let uuid = res.user.user_id;
    let  search_chat_room = await chat_room_receiver_info(uuid, req.body.blocked_user_id);
    console.log('search_chat_room: ', search_chat_room);
    await blocked_profile
      .findOne({
        where: { userId: ID, blocked_user_id: req.body.blocked_user_id },
      })
      .then(async (data) => {
        if (data != null) {
          data.destroy().then(async(num) => {
            if(!!search_chat_room){
              let chat_room_id = search_chat_room.chat_room_id;            

              await chat_rooms.update({chat_room_status:"active"},{where:{chat_room_id:chat_room_id}});
            }
            var blocked = { block_status: false };
            response.send_json(
              res,
              true,
              `Profile unblocked successfully`,
              CONSTANT.HTTP_SUCCESS,
              blocked
            );
          });
        } else {
          if(!!search_chat_room){
            let chat_room_id = search_chat_room.chat_room_id;
            await chat_rooms.update({chat_room_status:"blocked"},{where:{chat_room_id:chat_room_id}});
          }
          const fav_Find = await favourite.findOne({
            userId: ID,
            favourite_user_id: req.body.blocked_user_id,
          });
          if (!!fav_Find) {
            var delFav = await fav_Find.destroy();
            console.log('delFav: ', delFav);

            if(delFav){
              await blocked_profile
              .create({ userId: ID, blocked_user_id: req.body.blocked_user_id })
              .then((num) => {
                if (num) {
                  var block = { block_status: true };
                  response.send_json(
                    res,
                    true,
                    `Profile is blocked successfully.`,
                    CONSTANT.HTTP_SUCCESS,
                    block
                  );
                }
              });
            }            
          } else {
            blocked_profile
              .create({ userId: ID, blocked_user_id: req.body.blocked_user_id })
              .then((num) => {
                if (num) {
                  var block = { block_status: true };
                  response.send_json(
                    res,
                    true,
                    `Profile is blocked successfully.`,
                    CONSTANT.HTTP_SUCCESS,
                    block
                  );
                }
              });
          }
        }
      });
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
  }
};
