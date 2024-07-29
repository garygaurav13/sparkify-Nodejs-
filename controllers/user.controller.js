require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  sequelize_connect,
  users,
  user_spark,
  blocked_profile,
  reset_token,
  spark_category,
  spark_list,
  favourite,
  geolocation,
  sequelize,
  app_settings,
} = require("../database/db");
const response = require("../utils/http-response");
const sendEmail = require("../utils/sendEmail");
const CONSTANT = require("../constant/config");
const { v4: uuidv4 } = require("uuid");
const { check, validationResult } = require("express-validator");
const { Op } = require("sequelize");
const crypto = require("crypto");
const { log } = require("console");
const { matchCount } = require("../utils/helpers");

// Create and Save a new User
exports.create = async (req, res) => {
  // Create a user data
  const salt = await bcrypt.genSalt();
  const passwordHash = await bcrypt.hash(req.body.password, salt);
  const user = {
    email: req.body.email,
    password: passwordHash,
    user_id: uuidv4(),
  };
  //check if email is already exists
  users
    .findOne({
      where: {
        email: user.email,
      },
    })
    .then((data_old) => {
      if (data_old) {
        response.send_json(
          res,
          false,
          `User already exists`,
          CONSTANT.HTTP_SUCCESS
        );
      } else {
        // Save user in the database
        users.create(user).then((data) => {
          const accessToken = jwt.sign(
            {
              user: {
                email: data.email,
                id: data.id,
                user_id: data.user_id,
              },
            },
            process.env.API_KEY,
            { expiresIn: "30d" }
          );
          let userData = {
            token: accessToken,
            user: {
              user_id: data.user_id,
              email: data.email,
              status: data.status,
              account_status: data.account_status,
              is_profile_completed: data.is_profile_completed,
              sign_up_type: data.sign_up_type,
              isActive: data.isActive,
              isVerified: data.isVerified,
            },
          };
          response.send_json(
            res,
            true,
            `User successfully created.`,
            CONSTANT.HTTP_CREATED,
            userData
          );
        });
      }
    })
    .catch((err) => {
      response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
    });
};

// Retrieve all Users from the database.
exports.findAll = async (req, res) => {
  try {
    var RADIUS = "10000";
    var LIMIT = 100;
    var LoginTime = 60;
    var limit;
    var logintime;
    var radius;
    const user_ID = res.user.user_id;
    var { order, field, single, spark_id } = req.body;

    //search user by spark name
    if (!!req.body.name) {
      var sparkSearched = await spark_list.findAll({
        attributes: ["id"],
        where: {
          title: {
            [Op.like]: `${req.body.name}%`,
          },
        },
      });
      var allSearhSU = [];
      if (sparkSearched != "" && sparkSearched != null) {
        for (let list of sparkSearched) {
          var getUserId = await user_spark.findAll({
            attributes: ["userId"],
            where: { sparkListId: list.id },
          });
        }
        for (let u of getUserId) {
          allSearhSU.push(u.userId);
        }
      }
    }

    //spark search by spark id for filter
    var findSingleSparkIds = [];
    if (!!spark_id) {
      var findSparkById = await user_spark.findAll({
        attributes: ["userId"],
        where: { sparkListId: spark_id },
      });

      for (let data of findSparkById) {
        var fS_u = await users.findOne({
          attributes: ["user_id"],
          where: { id: data.userId },
        });
        findSingleSparkIds.push(fS_u.user_id);
      }
    }
    const appSet = await app_settings.findOne();
    if (appSet != null) {
      var logintime = appSet.time;
      var radius = appSet.radius;
    }

    if (limit != "" && limit != undefined) {
      LIMIT = limit;
    }
    if (radius != "" && radius != undefined) {
      RADIUS = radius;
    }
    if (logintime != "" && logintime != undefined) {
      LoginTime = logintime;
    }

    const block = await blocked_profile.findAll({
      where: { userId: res.user.id },
    });
    var block_ids = [];
    if (block != null) {
      for (const list of block) {
        block_ids.push(list.blocked_user_id);
      }
    }
    //get all users ids by them login user is blocked
    const blockedByUsers = await blocked_profile.findAll({
      where: { blocked_user_id: user_ID },
    });
    var blockedByUsersIds = [];
    blockedByUsersIds.push(res.user.id);
    if (blockedByUsers != null) {
      for (let list of blockedByUsers) {
        blockedByUsersIds.push(list.userId);
      }
    }
    var uniqueblockedByUsersIds = [...new Set(blockedByUsersIds)];
    //end here
    //login user lat long get
    const user_location = await geolocation.findOne({
      attributes: ["live_latitude", "live_longitude"],
      where: {
        userId: user_ID,
        live_latitude: { [Op.ne]: null },
        live_longitude: { [Op.ne]: null },
      },
    });
    var lat = "";
    var lng = "";
    if (user_location != null) {
      var lat = user_location.live_latitude;
      var lng = user_location.live_longitude;
    }

    const alluser = await users.findAll({
      attributes: {
        exclude: [
          "id",
          "password",
          "email",
          "createdAt",
          "updatedAt",
          "status",
          //"account_status",
          "is_profile_completed",
          "sign_up_type",
          "isActive",
          "isVerified",
        ], // hide this
      },
      where: {
        status: "1",
        is_profile_completed: "1",
        isActive: "1",       
        [Op.or]: [
          {
            firstname: {
              [Op.like]: `${req.body.name}%`,
            },
          },
          {
            lastname: {
              [Op.like]: `${req.body.name}%`,
            },
          },
        ],
        id: {
          [Op.notIn]: uniqueblockedByUsersIds,
        },
        user_id: {
          [Op.notIn]: block_ids,
        },
        last_login: {
          [sequelize.Op.gte]: new Date(
            new Date() - `${LoginTime}` * 60 * 1000
          ), // fify minute ago
        },
      },
      limit: LIMIT,
    });
    if (alluser.length > 0) {
      var geoData = [];
      if (lat != "" && lng != "") {
        for (const list of alluser) {
          var geo = await geolocation.findOne({
            attributes: [
              [
                sequelize.literal(
                  "3963 * acos(cos(radians(" +
                    lat +
                    ")) * cos(radians(live_latitude)) * cos(radians(" +
                    lng +
                    ") - radians(live_longitude)) + sin(radians(" +
                    lat +
                    ")) * sin(radians(live_latitude)))"
                ),
                "distance",
              ],
              "isVisible",
                      
            ],
            where: {
              userId: list.user_id,
              live_latitude: { [Op.ne]: null },
              live_longitude: { [Op.ne]: null },
            },
            having: { ["distance"]: { [Op.lte]: RADIUS } },
          });
          if (geo != null) {            
            list.dataValues.distance = geo.dataValues.distance.toFixed(2);           
            list.dataValues.distanceVisibility = geo.dataValues.isVisible;
            //get match spark count
            const matchC = await matchCount(user_ID, list.user_id);
            list.dataValues.matching = matchC.commonspark;
            //list.dataValues.unmatching = matchC.uncommon;
            geoData.push(list);
          }
        }
      } else {
        for (const list of alluser) {
          list.dataValues.distance = 0;
          //get match spark count
          const matchC = await matchCount(user_ID, list.user_id, spark_id);
          list.dataValues.matching = matchC.commonspark;
          //list.dataValues.unmatching = matchC.uncommon;
          geoData.push(list);
        }
      }
      geoData.filter((dd) => {
        if (dd.dataValues.account_status == 0 && (dd.dataValues.matching == 0)) {          
            var lin = geoData.indexOf(dd);
            delete geoData[lin];
        
          // delete dd.dataValues['distanceVisibility'];
          // delete dd.dataValues['distance'];
        }
      });
      geoData.filter((dd) => {
          if (dd.dataValues.distanceVisibility == "0") { 
            delete dd.dataValues['distanceVisibility'];
            delete dd.dataValues['distance'];
          }
        });
      //sorting for filtering
      if (field === "distance" && order === "asc") {
        geoData.sort(function (A, B) {
          var a = A.dataValues.distance;
          var b = B.dataValues.distance;
          return a - b;
        });
        // geoData.filter((dd) => {
        //   if (dd.dataValues.distanceVisibility == "0") {
        //     var lin = geoData.indexOf(dd);
        //     delete geoData[lin];
        //   }
        // });
        geoData = geoData.filter(function (n) {
          return n !== null;
        });
      } else if (field === "distance" && order === "desc") {
        geoData.sort(function (A, B) {
          var a = A.dataValues.distance;
          var b = B.dataValues.distance;
          return b - a;
        });
        geoData.filter((dd) => {
          if (dd.dataValues.distanceVisibility == "0") {
            var lin = geoData.indexOf(dd);
            delete geoData[lin];
          }
        });
        geoData = geoData.filter(function (n) {
          return n !== null;
        });
      } else if (field === "matching" && order === "asc") {
        geoData.sort(function (A, B) {
          var a = A.dataValues.matching;
          var b = B.dataValues.matching;
          return a - b;
        });
        geoData.filter((dd) => {
          if (dd.dataValues.matching == 0) {
            var lin = geoData.indexOf(dd);
            delete geoData[lin];
          }
        });
        geoData = geoData.filter(function (n) {
          return n !== null;
        });
      } else if (field === "matching" && order === "desc") {
        geoData.sort(function (A, B) {
          var a = A.dataValues.matching;
          var b = B.dataValues.matching;
          return b - a;
        });
        geoData.filter((dd) => {
          if (dd.dataValues.matching == 0) {
            var lin = geoData.indexOf(dd);
            delete geoData[lin];
          }
        });
        geoData = geoData.filter(function (n) {
          return n !== null;
        });
      } else {
        geoData.sort(function (A, B) {
          var a = A.dataValues.distance;
          var b = B.dataValues.distance;
          return a - b;
        });
      }
      if (single != "" && single == "spark") {
        var singleData = [];
        // geoData.filter((d) => {
        //   if (d.dataValues.matching === 1) {
        //     singleData.push(d.dataValues);
        //   }
        // });
        if (!!spark_id) {
          var common = geoData.filter((x) =>
            findSingleSparkIds.includes(x.user_id)
          );
        } 
        // else {
        //   var common = singleData;
        // }

        common.sort(function (A, B) {
          var a = A.distance;
          var b = B.distance;
          return a - b;
        });

        if (common.length > 0) {
          response.send_json(
            res,
            true,
            `Retrieve all users.`,
            CONSTANT.HTTP_SUCCESS,
            common
          );
        } else {
          response.send_json(res, true, `Not Found.`, CONSTANT.HTTP_SUCCESS);
        }
      } else {
        response.send_json(
          res,
          true,
          `Retrieve all users.`,
          CONSTANT.HTTP_SUCCESS,
          geoData
        );
      }
      //if user not found by name then search in spark
    } else if (!!allSearhSU && allSearhSU.length > 0) {
      const allusers = await users.findAll({
        attributes: {
          exclude: [
            "id",
            "password",
            "email",
            "createdAt",
            "updatedAt",
            "status",
            //"account_status",
            "is_profile_completed",
            "sign_up_type",
            "isActive",
            "isVerified",
          ], // hide this
        },
        where: {
          status: "1",
          is_profile_completed: "1",
          isActive: "1",
          //account_status: "1",
          id: {
            [Op.notIn]: uniqueblockedByUsersIds,
            [Op.in]: allSearhSU,
          },
          user_id: {
            [Op.notIn]: block_ids,
          },
          last_login: {
            [sequelize.Op.gte]: new Date(
              new Date() - `${LoginTime}` * 60 * 1000
            ), // fify minute ago
          },
        },
        limit: LIMIT,
      });

      if (allusers.length > 0) {
        var geoData = [];
        if (lat != "" && lng != "") {
          for (const list of allusers) {
            var geo = await geolocation.findOne({
              attributes: [
                [
                  sequelize.literal(
                    "3963 * acos(cos(radians(" +
                      lat +
                      ")) * cos(radians(live_latitude)) * cos(radians(" +
                      lng +
                      ") - radians(live_longitude)) + sin(radians(" +
                      lat +
                      ")) * sin(radians(live_latitude)))"
                  ),
                  "distance",
                ],  
                "isVisible",              
              ],
              where: {
                userId: list.user_id,
                live_latitude: { [Op.ne]: null },
                live_longitude: { [Op.ne]: null },
              },
              having: { ["distance"]: { [Op.lte]: RADIUS } },
            });
            if (geo != null) {
              if(geo.dataValues.isVisible == "1"){
                list.dataValues.distance = geo.dataValues.distance.toFixed(2);
              }else{
                list.dataValues.distance =NIL;
              }
              list.dataValues.distanceVisibility = geo.dataValues.isVisible;
              //get match spark count
              const matchC = await matchCount(user_ID, list.user_id);
              list.dataValues.matching = matchC.commonspark;
              //list.dataValues.unmatching = matchC.uncommon;
              geoData.push(list);
            }
          }
        } else {
          for (const list of allusers) {
            list.dataValues.distance = 0;
            //get match spark count
            const matchC = await matchCount(user_ID, list.user_id, spark_id);
            list.dataValues.matching = matchC.commonspark;
            //list.dataValues.unmatching = matchC.uncommon;
            geoData.push(list);
          }
        }
        //sorting for filtering
        if (field === "distance" && order === "asc") {
          geoData.sort(function (A, B) {
            var a = A.dataValues.distance;
            var b = B.dataValues.distance;
            return a - b;
          });
          geoData.filter((dd) => {
            if (dd.dataValues.distanceVisibility == "0") {
              var lin = geoData.indexOf(dd);
              delete geoData[lin];
            }
          });
          geoData = geoData.filter(function (n) {
            return n !== null;
          });
        } else if (field === "distance" && order === "desc") {
          geoData.sort(function (A, B) {
            var a = A.dataValues.distance;
            var b = B.dataValues.distance;
            return b - a;
          });
          // geoData.filter((dd) => {
          //   if (dd.dataValues.distanceVisibility == "0") {
          //     var lin = geoData.indexOf(dd);
          //     delete geoData[lin];
          //   }
          // });
          geoData = geoData.filter(function (n) {
            return n !== null;
          });
        } else if (field === "matching" && order === "asc") {
          geoData.sort(function (A, B) {
            var a = A.dataValues.matching;
            var b = B.dataValues.matching;
            return a - b;
          });
          geoData.filter((dd) => {
            if (dd.dataValues.matching == 0) {
              var lin = geoData.indexOf(dd);
              delete geoData[lin];
            }
          });
          geoData = geoData.filter(function (n) {
            return n !== null;
          });
        } else if (field === "matching" && order === "desc") {
          geoData.sort(function (A, B) {
            var a = A.dataValues.matching;
            var b = B.dataValues.matching;
            return b - a;
          });
          geoData.filter((dd) => {
            if (dd.dataValues.matching == 0) {
              var lin = geoData.indexOf(dd);
              delete geoData[lin];
            }
          });
          geoData = geoData.filter(function (n) {
            return n !== null;
          });
        } 
        // else if (field === "unmatching" && order === "asc") {
        //   geoData.sort(function (A, B) {
        //     var a = A.dataValues.unmatching;
        //     var b = B.dataValues.unmatching;
        //     return a - b;
        //   });
        // } else if (field === "unmatching" && order === "desc") {
        //   geoData.sort(function (A, B) {
        //     var a = A.dataValues.unmatching;
        //     var b = B.dataValues.unmatching;
        //     return b - a;
        //   });
        // } 
        else {
          geoData.sort(function (A, B) {
            var a = A.dataValues.distance;
            var b = B.dataValues.distance;
            return a - b;
          });
        }
        if (single != "" && single == "spark") {
          var singleData = [];
          geoData.filter((d) => {
            if (d.dataValues.matching === 1) {
              singleData.push(d.dataValues);
            }
          });
          if (!!spark_id) {
            var common = singleData.filter((x) =>
              findSingleSparkIds.includes(x.user_id)
            );
          } else {
            var common = singleData;
          }

          common.sort(function (A, B) {
            var a = A.distance;
            var b = B.distance;
            return a - b;
          });

          if (singleData.length > 0) {
            response.send_json(
              res,
              true,
              `Retrieve all users.`,
              CONSTANT.HTTP_SUCCESS,
              common
            );
          } else {
            response.send_json(res, true, `Not Found.`, CONSTANT.HTTP_SUCCESS);
          }
        } else {
          response.send_json(
            res,
            true,
            `Retrieve all users.`,
            CONSTANT.HTTP_SUCCESS,
            geoData
          );
        }
      }

      //end here user search by spark name
    } else {
      response.send_json(res, true, `Not Found.`, CONSTANT.HTTP_SUCCESS);
    }
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
  }
};

// Find a single user with an id
exports.findOne = async (req, res) => {
  const user_id = req.params.id;
  const loginUser = res.user.id;

  //get all users ids by them login user is blocked
  const blockedByUsers = await blocked_profile.findAll({
    where: { blocked_user_id: res.user.user_id },
  });
  var blockedByUsersIds = [];
  blockedByUsersIds.push(res.user.id);
  if (blockedByUsers != null) {
    for (let list of blockedByUsers) {
      blockedByUsersIds.push(list.userId);
    }
  }
  var uniqueblockedByUsersIds = [...new Set(blockedByUsersIds)];
  //end here
  users
    .findOne({
      attributes: {
        exclude: [
          "password",
          "email",
          "createdAt",
          "updatedAt",
          "status",
          "account_status",
          "is_profile_completed",
          "sign_up_type",
          "isActive",
          "isVerified",
        ], // hide this
      },
      where: {
        user_id: user_id,
        id: {
          [Op.notIn]: uniqueblockedByUsersIds,
        },
      },
    })
    .then(async (data) => {
      if (data) {        

        const favouriteStatus = await favourite.findOne({
          where: {
            userID: loginUser,
            favourite_user_id: user_id,
          },
        });
        if (favouriteStatus) {
          var fav = true;
        } else {
          var fav = false;
        }
        const blockStatus = await blocked_profile.findOne({
          where: {
            userID: loginUser,
            blocked_user_id: user_id,
          },
        });
        if (blockStatus) {
          var blk = true;
        } else {
          var blk = false;
        }
        //match un match sparks
        const allSparks = await user_spark.findAll({
          attributes: ["sparkCategoryId", "sparkListId"],
          where: { userId: loginUser },
        });
        const searhU = await user_spark.findAll({
          attributes: ["sparkCategoryId", "sparkListId","isVisible"],
          where: { userId: data.id },
        });        
        if (searhU.length > 0) {
          var loginSp = [];
          var searchSp = [];
          var SparkVisible;
          allSparks.forEach((e) => {
            loginSp.push(e.sparkListId);
          });
          searhU.forEach((e) => {
            searchSp.push(e.sparkListId);
            SparkVisible = e.isVisible;
          });   
                 
          let difference = searchSp.filter((x) => !loginSp.includes(x));
          let common = loginSp.filter((x) => searchSp.includes(x));
          let comondata = await spark_list.findAll({
            attributes: ["title", "sparkCategoryId"],
            where: {
              id: {
                [Op.in]: common,
              },
            },
          });
          let diffdata = await spark_list.findAll({
            attributes: ["title", "sparkCategoryId"],
            where: {
              id: {
                [Op.in]: difference,
              },
            },
          });
          var userCommonSpark = [];
          var userMisMatch = [];
          if (comondata) {
            for (const d of comondata) {
              var cat = await spark_category.findOne({
                where: { id: d.sparkCategoryId },
              });
              userCommonSpark.push({ title: d.title, icon: cat.icon });
            }
          }
          if (diffdata) {
            for (const d of diffdata) {
              var cat = await spark_category.findOne({
                where: { id: d.sparkCategoryId },
              });
              userMisMatch.push({ title: d.title, icon: cat.icon });
            }
          }
          var sparks_visibility = true;
        } else {
          var userCommonSpark = [];
          var userMisMatch = [];
          var sparks_visibility = false;
        }
        
        if(SparkVisible == 1){
          var userAll = {
            user: data,
            matched: userCommonSpark,
            unmatched: userMisMatch,
            favourite: fav,
            blocked: blk,
            spark_visibility: true,
          };
        }else{
          var userAll = {
            user: data,
            matched: userCommonSpark,            
            favourite: fav,
            blocked: blk,
            spark_visibility: false,
          };
        }
        // let userAll = {
        //   user: data,
        //   matched: userCommonSpark,
        //   unmatched: userMisMatch,
        //   favourite: fav,
        //   blocked: blk,
        //   spark_visibility: sparks_visibility,
        // };

        //end match mis match code
        response.send_json(
          res,
          true,
          `User information with id=${user_id}.`,
          CONSTANT.HTTP_SUCCESS,
          userAll
        );
      } else {
        var message = { status: "blocked" };
        response.send_json(
          res,
          false,
          `Access denied by user`,
          CONSTANT.HTTP_SUCCESS,
          message
        );
      }
    })
    .catch((err) => {
      response.send_json(
        res,
        false,
        `Error retrieving user with id=${user_id}.`,
        CONSTANT.HTTP_SERVER_ERROR
      );
    });
};

// Update a user by the id in the request
exports.update = (req, res) => {
  const id = req.params.id;

  users
    .update(req.body, {
      where: { user_id: id },
    })
    .then((num) => {
      if (num == 1) {
        users
          .findOne({
            attributes: {
              exclude: [
                "id",
                "password",
                "email",
                "createdAt",
                "updatedAt",
                "status",
                "account_status",
                "is_profile_completed",
                "sign_up_type",
                "isActive",
                "isVerified",
              ], // hide this
            },
            where: { user_id: id },
          })
          .then((data) => {
            response.send_json(
              res,
              true,
              "Profile is updated successfully.",
              CONSTANT.HTTP_SUCCESS,
              data
            );
          });
      } else {
        response.send_json(
          res,
          false,
          `Cannot update user with id=${id}. User was not found`,
          CONSTANT.HTTP_SUCCESS
        );
      }
    })
    .catch((err) => {
      response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
    });
};

// Delete a user with the specified id in the request
exports.delete = (req, res) => {
  const id = req.params.id;

  users
    .findOne({ where: { user_id: id } })
    .then((data) => {
      if (data) {
        users
          .update(
            { status: "2" },
            {
              where: { user_id: id },
            }
          )
          .then((num) => {
            if (num) {
              response.send_json(
                res,
                true,
                "User was deleted successfully!",
                CONSTANT.HTTP_SUCCESS
              );
            }
          });
      } else {
        response.send_json(
          res,
          false,
          `User not found!`,
          CONSTANT.HTTP_SUCCESS
        );
      }
    })
    .catch((err) => {
      response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
    });
};

//user login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  await users
    .findOne({
      where: { email: email },
    })
    .then((data) => {
      if (data) {
        if (data.status != "1") {
          response.send_json(
            res,
            false,
            "Access blocked! Please contact admin",
            CONSTANT.HTTP_FORBIDDEN
          );
          return;
        }
        let userSelectedSparks = [];
        user_spark
          .findAll({ where: { userId: data.id } })
          .then(async (data) => {
            if (data) {
              for (const list of data) {
                var catData = await spark_category.findOne({
                  where: { id: list.sparkCategoryId },
                });
                var catList = await spark_list.findOne({
                  where: { id: list.sparkListId },
                });

                userSelectedSparks.push({
                  catId: catData.id,
                  Category: catData.title,
                  subCatId: catList.id,
                  subCategory: catList.title,
                  icon: catData.icon,
                });
              }
            }
          });
        bcrypt.compare(password, data.password).then((val) => {
          console.log('val', val);
          if (val) {
            const accessToken = jwt.sign(
              {
                user: {
                  email: data.email,
                  id: data.id,
                  user_id: data.user_id,
                },
              },
              process.env.API_KEY,
              { expiresIn: "30d" }
            );
            users.update(
              { last_login: new Date() },
              {
                where: {
                  id: data.id,
                },
              }
            );
            if (data.is_profile_completed == "0") {
              let userData = {
                token: accessToken,
                user: {
                  user_id: data.user_id,
                  email: data.email,
                  status: data.status,
                  account_status: data.account_status,
                  is_profile_completed: data.is_profile_completed,
                  sign_up_type: data.sign_up_type,
                  isActive: data.isActive,
                  isVerified: data.isVerified,
                },
                user_sparks: userSelectedSparks,
              };
              response.send_json(
                res,
                true,
                "User logged in successfully!",
                CONSTANT.HTTP_SUCCESS,
                userData
              );
            } else {
              let userData = {
                token: accessToken,
                user: {
                  user_id: data.user_id,
                  email: data.email,
                  firstname: data.firstname,
                  lastname: data.lastname,
                  avatar: data.avatar,
                  occupation: data.occupation,
                  zipcode: data.zipcode,
                  generation: data.generation,
                  birthdate: data.birthdate,
                  birthday: data.birthday,
                  birthmonth: data.birthmonth,
                  formatted_address: data.formatted_address,
                  status: data.status,
                  account_status: data.account_status,
                  is_profile_completed: data.is_profile_completed,
                  sign_up_type: data.sign_up_type,
                  isActive: data.isActive,
                  isVerified: data.isVerified,
                },
                user_sparks: userSelectedSparks,
              };

              response.send_json(
                res,
                true,
                "User logged in successfully!",
                CONSTANT.HTTP_SUCCESS,
                userData
              );
            }
          } else {
            response.send_json(
              res,
              false,
              `Enter valid password. Password is wrong`,
              CONSTANT.HTTP_SUCCESS
            );
          }
        });
      } else {
        response.send_json(
          res,
          false,
          `Cannot find user with email=${email}. User was not found`,
          CONSTANT.HTTP_SUCCESS
        );
      }
    })
    .catch((err) => {
      response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
    });
};

//search user by name
exports.search = async (req, res) => {
  try {
    const Userid = res.user.user_id;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      response.send_json(
        res,
        false,
        `Name field is reguired`,
        CONSTANT.HTTP_BAD_REQUEST
      );
    } else {
      const b_user = await blocked_profile.findAll({
        attributes: ["blocked_user_id"],
        where: { userid: res.user.id },
      });
      const block_u = [];

      b_user.forEach((el) => {
        block_u.push(el.blocked_user_id);
      });

      //get all users ids by them login user is blocked
      const blockedByUsers = await blocked_profile.findAll({
        where: { blocked_user_id: res.user.user_id },
      });
      var blockedByUsersIds = [];
      blockedByUsersIds.push(res.user.id);
      if (blockedByUsers != null) {
        for (let list of blockedByUsers) {
          blockedByUsersIds.push(list.userId);
        }
      }
      var uniqueblockedByUsersIds = [...new Set(blockedByUsersIds)];
      //end here
      const userData = await users.findAll({
        where: {
          firstname: {
            [Op.like]: `${req.body.name}%`,
          },
          id: { [Op.notIn]: block_u },
          id: {
            [Op.notIn]: uniqueblockedByUsersIds,
          },
          [Op.not]: [{ user_id: Userid }],
          [Op.and]: [
            { status: "1" },
            { is_profile_completed: "1" },
            { isActive: "1" },
            { account_status: "1" },
          ],
        },
        limit: 100,
      });

      if (userData.length > 0) {
        response.send_json(
          res,
          true,
          `Users get successfully!`,
          CONSTANT.HTTP_SUCCESS,
          userData
        );
      } else {
        response.send_json(res, true, `Users not found`, CONSTANT.HTTP_SUCCESS);
      }
    }
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
  }
};

//user forgot password
exports.forgotpassword = async (req, res) => {
  try {
    const errors = validationResult(req);

    // validate email field
    if (!errors.isEmpty()) {
      response.send_json(
        res,
        false,
        `Email is not valid`,
        CONSTANT.HTTP_BAD_REQUEST
      );
      return;
    }

    const email = req.body.email;
    const singleUser = await users.findOne({ where: { email: email } });

    // no user found
    if (singleUser === null) {
      response.send_json(res, false, `No user found`, CONSTANT.HTTP_SUCCESS);
      return;
    }

    const user_id = singleUser.user_id;

    // updating existing token to 1 for this user
    await reset_token.update(
      {
        used: 1,
      },
      {
        where: {
          user_id: user_id,
        },
      }
    );

    //Create a random reset token
    const fpSalt = crypto.randomBytes(64).toString("hex");

    //token expires after 1 hr
    const expireDate = new Date(new Date().getTime() + 60 * 60 * 1000);

    //insert token data into DB
    const reset_pass = await reset_token.create({
      user_id: user_id,
      token: fpSalt,
      expiration: expireDate,
      used: 0,
    });

    // initiate email
    let message;
    const resetUrl = `${process.env.SITE_URL}/reset-password/?token=${reset_pass.token}&id=${user_id}`;
    message = `<p>Please click the below link to reset your password, the following link will be valid for only 5min:</p>
          <p><a target="_blank" href="${resetUrl}">Click here to reset password</a></p>`;
    const mail_data = {
      to: email,
      subject: CONSTANT.email.forgot.FORGOT_EMAIL_SUB,
      html: `<h4>Reset Password</h4>
      ${message}`,
    };
    await sendEmail(mail_data);
    response.send_json(
      res,
      true,
      CONSTANT.email.forgot.FORGOT_EMAIL_RES_MSG,
      CONSTANT.HTTP_SUCCESS
    );
  } catch (err) {
    response.send_json(res, false, err.message, CONSTANT.HTTP_SERVER_ERROR);
  }
};

//user reset password
exports.resetpassword = async (req, res) => {
  try {
    const errors = validationResult(req);

    // validate email field
    if (!errors.isEmpty()) {
      response.send_json(
        res,
        false,
        `User ID or Token Invalid`,
        CONSTANT.HTTP_SUCCESS
      );
      return;
    }

    // if token valid setting up new password
    //compare passwords
    const new_pass = req.body.new_pass;
    const confirm_pass = req.body.confirm_pass;

    // both new and confirm needed
    if (new_pass == "" || confirm_pass == "") {
      response.send_json(
        res,
        false,
        "New and Confirm passwords required",
        CONSTANT.HTTP_SUCCESS
      );
      return;
    }

    // match new and confirm
    if (new_pass !== confirm_pass) {
      response.send_json(
        res,
        false,
        "New and Confirm passwords do not match",
        CONSTANT.HTTP_SUCCESS
      );
      return;
    }

    // both new and confirm needed
    const min_pass_length = 6;
    if (
      new_pass.length < min_pass_length ||
      confirm_pass.length < min_pass_length
    ) {
      response.send_json(
        res,
        false,
        "New and Confirm passwords Minimum 6 characters required!",
        CONSTANT.HTTP_SUCCESS
      );
      return;
    }

    const user_id = req.body.user_id;

    // update password
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(confirm_pass, salt);
    await users.update(
      {
        password: passwordHash,
      },
      {
        where: {
          user_id: user_id,
        },
      }
    );

    // if token valid and exist
    await reset_token.update(
      {
        used: 1,
      },
      {
        where: {
          user_id: user_id,
        },
      }
    );

    response.send_json(
      res,
      true,
      `Password changed successfully`,
      CONSTANT.HTTP_SUCCESS
    );
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.email.HTTP_SERVER_ERROR);
  }
};

//update live location

exports.liveLocation = async (req, res) => {
  try {
    var userID = res.user.user_id;
    const { latitude, longitude } = req.body;

    if (latitude != "" && longitude != "") {
      const lt = await geolocation.update(
        { live_latitude: latitude, live_longitude: longitude },
        { where: { userId: userID } }
      );
      const upLogin = await users.update(
        { last_login: new Date() },
        {
          where: {
            user_id: userID,
          },
        }
      );
      response.send_json(
        res,
        true,
        `Location and login updated Sucessfully`,
        CONSTANT.HTTP_SUCCESS
      );
    } else {
      const upLogin = await users.update(
        { last_login: new Date() },
        {
          where: {
            user_id: userID,
          },
        }
      );
      response.send_json(
        res,
        true,
        `Login time updated Sucessfully`,
        CONSTANT.HTTP_SUCCESS
      );
    }
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.email.HTTP_SERVER_ERROR);
  }
};

