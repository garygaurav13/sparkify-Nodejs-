require("dotenv").config();
const {
  users,
  user_spark,
  blocked_profile,
  spark_category,
  spark_list,
  generation,
  geolocation,
} = require("../database/db");
const response = require("../utils/http-response");
const CONSTANT = require("../constant/config");
const bcrypt = require("bcrypt");
const path = require("path");
const { get_users_sparks, is_user_valid } = require("../utils/helpers");
const { Op } = require("sequelize");

// multer code for avatar upload
const multer = require("multer");
const multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  region: process.env.S3_REGION_KEY,
});

const s3Storage = multerS3({
  s3: s3, // s3 instance
  bucket: process.env.S3_BUCKET_NAME, // change it as per your project requirement
  acl: "public-read", // storage access type
  contentType: multerS3.AUTO_CONTENT_TYPE,
  metadata: (req, file, cb) => {
    cb(null, { fieldname: file.fieldname });
  },
  key: (req, file, cb) => {
    const fileName =
      process.env.S3_USER_AVATAR_PATH +
      Date.now() +
      "_" +
      file.fieldname +
      "_" +
      file.originalname;
    cb(null, fileName);
  },
});
const upload = multer({
  storage: s3Storage,
  limits: { fileSize: 10 * 1000 * 1000 },
  metadata: (req, file, cb) => {
    cb(null, { fieldname: file.fieldname });
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(`File format is not support`, false);
      return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  },
}).single("avatar");

//get user profile
exports.get = async (req, res) => {
  var user_ID = res.user.user_id;
  try {
    await users.findOne({ where: { user_id: user_ID } }).then((userData) => {
      if (userData) {
        let userSelectedSparks = [];
        user_spark
          .findAll({ where: { userId: userData.id } })
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
            var user_profile = {
              profile: userData,
              user_sparks: userSelectedSparks,
            };
            response.send_json(
              res,
              true,
              "Profile data is get successfully.",
              CONSTANT.HTTP_SUCCESS,
              user_profile
            );
          });
      } else {
        response.send_json(
          res,
          false,
          `Profile is not find`,
          CONSTANT.HTTP_SUCCESS
        );
      }
    });
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
  }
};

//get other user profile
exports.view_other_profile = async (req, res) => {
  const current_uid = res.user.id;
  try {
    let other_profile_id = req.body.other_profile_id;

    // check other profile exist
    if (!other_profile_id) {
      response.send_json(res, false, "No profile found", CONSTANT.HTTP_SUCCESS);
      return;
    }

    // query other profile data
    const other_user_data = await users.findOne({
      where: { user_id: other_profile_id },
      attributes: [
        "id",
        "avatar",
        "firstname",
        "lastname",
        "zipcode",
        "birthdate",
      ],
    });

    // check profile exist
    if (!other_user_data) {
      response.send_json(res, false, "No profile found", CONSTANT.HTTP_SUCCESS);
      return;
    }

    // getting plain user id from uuid
    other_profile_id = other_user_data.id;

    // validate other user exist and not blocked
    const all_valid_users = await is_user_valid(current_uid, other_profile_id);
    if (all_valid_users === null) {
      response.send_json(res, false, "No profile found", CONSTANT.HTTP_SUCCESS);
      return;
    }

    // query users sparks
    // const sparks = await user_spark.findAll({
    //   include: ["subcategory"],
    //   attributes: [
    //     ["sparkCategoryId", "CatId"],
    //     ["sparkListId", "subCatId"],
    //   ],
    //   where: {
    //     userID: {
    //       [Op.in]: [current_uid, other_profile_id],
    //     },
    //   },
    // });

    // remove id from response
    delete other_user_data.dataValues["id"];

    //const { matchingTitles, nonMatchingTitles } = get_users_sparks(sparks);
    response.send_json(res, true, null, 200, [
      {
        user: other_user_data,
        matching_sparks: [],
        non_matching_sparks: [],
      },
    ]);
  } catch (err) {
    response.send_json(res, false, err.message, CONSTANT.HTTP_SERVER_ERROR);
  }
};

//update user profile
exports.edit = (req, res) => {
  var user_ID = res.user.user_id;
 
  //    users
  let userD = {
    firstname: req.body.firstname,
    lastname: req.body.lastname,
    occupation: req.body.occupation,
    zipcode: req.body.zipcode,
    formatted_address: req.body.address.formatted_address,
    generation: req.body.generation,
    birthdate: req.body.birthdate,
    birthday: req.body.birthday,
    birthmonth: req.body.birthmonth,
  };

  users
    .update(userD, {
      where: { user_id: user_ID },
    })
    .then((num) => {
      if (num == 1) {
        geolocation
          .update(
            {
              perm_place_id: req.body.address.place_id,
              perm_latitude: req.body.address.latitude,
              perm_longitude: req.body.address.longitude,
              perm_formatted_address: req.body.address.formatted_address                          
            },
            { where: { userId: user_ID } }
          )
          .then((geo) => {
            if (geo == 1) {
              users
                .findOne({
                  where: { user_id: user_ID },
                })
                .then((userData) => {
                  response.send_json(
                    res,
                    true,
                    "Profile is updated successfully.",
                    CONSTANT.HTTP_SUCCESS,
                    userData
                  );
                });
            } else {
              response.send_json(
                res,
                false,
                `Geolocation is not updated`,
                CONSTANT.HTTP_SUCCESS
              );
            }
          });
      } else {
        response.send_json(
          res,
          false,
          `Profile is not updated`,
          CONSTANT.HTTP_SUCCESS
        );
      }
    })

    .catch((err) => {
      response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
    });
};
//upload profile image
exports.avatar = async (req, res) => {
  try {
    var user_ID = res.user.user_id;
    await upload(req, res, function (err) {
      if (err) {
        response.send_json(res, false, err, CONSTANT.HTTP_SUCCESS);
        return;
      } else {
        let avatar = req.file.location;
        users
          .update(
            { avatar: avatar },
            {
              where: { user_id: user_ID },
            }
          )
          .then((num) => {
            if (num == 1) {
              users
                .findOne({
                  where: { user_id: user_ID },
                })
                .then((data) => {
                  let profile = {
                    avatar: avatar,
                  };
                  response.send_json(
                    res,
                    true,
                    "Profile image is updated successfully.",
                    CONSTANT.HTTP_SUCCESS,
                    profile
                  );
                });
            } else {
              response.send_json(
                res,
                false,
                "Profile image is not updated.",
                CONSTANT.HTTP_SUCCESS
              );
            }
          })
          .catch((err) => {
            response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
          });
      }
    });
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
  }
};

//update user password
exports.password = async (req, res) => {
  try {
    var user_ID = res.user.user_id;
    let oldpass = req.body.old_password;
    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(req.body.password, salt);
    await users.findOne({ where: { user_id: user_ID } }).then((data) => {
      bcrypt.compare(oldpass, data.password).then((val) => {
        if (val) {
          users
            .update({ password: passwordHash }, { where: { user_id: user_ID } })
            .then((num) => {
              if (num == 1) {
                response.send_json(
                  res,
                  true,
                  `Password updated successfully!`,
                  CONSTANT.HTTP_SUCCESS
                );
              } else {
                response.send_json(
                  res,
                  false,
                  `Password is not updated!`,
                  CONSTANT.HTTP_SUCCESS
                );
              }
            });
        } else {
          response.send_json(
            res,
            false,
            `Password is mismatch`,
            CONSTANT.HTTP_SUCCESS
          );
        }
      });
    });
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
  }
};

//create user profile
exports.create = async (req, res) => {
  try {
    var user_ID = res.user.user_id;
    const profilePic = await users.findOne({where:{user_id: user_ID }});
    if(profilePic.avatar == null){
      response.send_json(res, false, `Profile picture is missing`, CONSTANT.HTTP_SUCCESS);
    }else{
    const userp = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      occupation: req.body.occupation,
      zipcode: req.body.zipcode,
      formatted_address: req.body.address.formatted_address,
      generation: req.body.generation,
      birthdate: req.body.birthdate,
      birthday: req.body.birthday,
      birthmonth: req.body.birthmonth,
      is_profile_completed: "1",
    };
    await users.update(userp, { where: { user_id: user_ID } }).then((num) => {
      if (num == 1) {
        geolocation
          .findOne({ where: { userID: user_ID } })
          .then(async (gData) => {
            if (gData) {
              await gData.destroy();
            }
          });
        geolocation
          .create({
            userId: user_ID,
            perm_place_id: req.body.address.place_id,
            perm_latitude: req.body.address.latitude,
            perm_longitude: req.body.address.longitude,
            perm_formatted_address: req.body.address.formatted_address,
            live_latitude: req.body.address.latitude,
            live_longitude: req.body.address.longitude,
          })
          .then((geo) => {
            if (geo) {
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
                      "sign_up_type",
                      "isActive",
                      "isVerified",
                    ], // hide this
                  },
                  where: { user_ID: user_ID },
                })
                .then((data) => {
                  if (data) {
                    response.send_json(
                      res,
                      true,
                      `Profile created successfully!`,
                      CONSTANT.HTTP_SUCCESS,
                      data
                    );
                  }
                });
            }
          });
      } else {
        response.send_json(
          res,
          false,
          `Profile is not created`,
          CONSTANT.HTTP_SUCCESS
        );
      }
    });
  }
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
  }
};

//get all generation

exports.generation = async (req, res) => {
  try {
    await generation
      .findAll({ attributes: ["value", "title"] })
      .then((data) => {
        if (data) {
          response.send_json(
            res,
            true,
            `Successfully get !`,
            CONSTANT.HTTP_SUCCESS,
            data
          );
        } else {
          response.send_json(
            res,
            false,
            `Generation not found`,
            CONSTANT.HTTP_SUCCESS
          );
        }
      });
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
  }
};

//profile visibility manage by user

exports.visibility = async (req, res) => {
  try {
    const userId = res.user.id;
    const visi = await users.findOne({
      attributes: ["account_status"],
      where: { id: userId },
    });
    if (visi.account_status == "1") {
      const ch = await users.update(
        { account_status: "0" },
        {
          where: {
            id: userId,
          },
        }
      );
      const redata = { visible: false };
      if (ch) {
        response.send_json(
          res,
          true,
          `Profile visibility OFF successfully!`,
          CONSTANT.HTTP_SUCCESS,
          redata
        );
      }
    } else {
      const ch = await users.update(
        { account_status: "1" },
        {
          where: {
            id: userId,
          },
        }
      );
      const redata = { visible: true };
      if (ch) {
        response.send_json(
          res,
          true,
          `Profile visibility ON successfully!`,
          CONSTANT.HTTP_SUCCESS,
          redata
        );
      }
    }
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
  }
};
