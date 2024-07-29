require("dotenv").config();
const { users, favourite, blocked_profile } = require("../database/db");
const response = require("../utils/http-response");
const CONSTANT = require("../constant/config");

//get favourite
exports.get = async (req, res) => {
  try {
    let ID = res.user.id;
    const favdata = await favourite.findAll({ where: { userId: ID } });
    var userD = [];
    if (favdata) {
      for (const list of favdata) {
        const userdetail = await users.findOne({
          attributes: ["user_id", "firstname", "lastname", "avatar"],
          where: { user_id: list.favourite_user_id },
        });

        userD.push({
          firstname: userdetail.firstname,
          lastname: userdetail.lastname,
          avatar: userdetail.avatar,
          favourite_user_id: userdetail.user_id,
        });
      }
      response.send_json(
        res,
        true,
        `Favorite profiles get successfully`,
        CONSTANT.HTTP_SUCCESS,
        userD
      );
    } else {
      response.send_json(
        res,
        false,
        `Favorite profiles not found.`,
        CONSTANT.HTTP_SUCCESS
      );
    }
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
  }
};

//create favourite
exports.create = async (req, res) => {
  try {
    let ID = res.user.id;
    await favourite
      .findOne({
        where: { userId: ID, favourite_user_id: req.body.favourite_user_id },
      })
      .then(async(data) => {
        if (data != null) {
          data.destroy().then(async (num) => {
            var fav = { 'favourite_status':false};
           
            response.send_json(
              res,
              true,
              `Favorite remove successfully`,
              CONSTANT.HTTP_SUCCESS,
              fav
            );
          });
        } else {
          const favdata = await blocked_profile.findOne({
            where: {
              userId: ID,
              blocked_user_id: req.body.favourite_user_id,
            },
          });          
          if(favdata != null){
            var fav = { 'favorite_status':false};
            response.send_json(
              res,
              false,
              `Profile is blocked can't be added`,
              CONSTANT.HTTP_SUCCESS,
              fav
            );
          }else{
            const favadd = favourite
            .create({
              userId: ID,
              favourite_user_id: req.body.favourite_user_id,
            });
            if(favadd){
              var addfav = {                    
                'favourite_status': true,
              };
              response.send_json(
                res,
                true,
                `Profile is marked favorite`,
                CONSTANT.HTTP_SUCCESS,
                addfav
              );
            }
          }
        }
      });
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
  }
};
