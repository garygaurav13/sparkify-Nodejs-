require("dotenv").config();
const {
  users,
  user_spark,
  spark_category,
  spark_list,
} = require("../database/db");
const response = require("../utils/http-response");
const CONSTANT = require("../constant/config");
const { check, validationResult } = require("express-validator");
const { Op } = require("sequelize");

//get user sparks
exports.get = async (req, res) => {
  try {
    var user_ID = res.user.id;
    await user_spark
      .findAll({ where: { userId: user_ID } })
      .then(async (data) => {
        if (data) {
          var allData = [];
          for (const list of data) {
            var catData = await spark_category.findOne({
              where: { id: list.sparkCategoryId },
            });
            var catList = await spark_list.findOne({
              where: { id: list.sparkListId },
            });

            allData.push({
              catId: catData.id,
              Category: catData.title,
              subCatId: catList.id,
              subCategory: catList.title,
              icon: catData.icon,
            });
          }

          response.send_json(
            res,
            true,
            `User sparks get successfully!`,
            CONSTANT.HTTP_SUCCESS,
            allData
          );
        } else {
          response.send_json(
            res,
            false,
            `User sparks not found!`,
            CONSTANT.HTTP_SUCCESS,
            allData
          );
        }
      });
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
  }
};

//update user sparks
exports.create = async (req, res) => {
  try {
    var user_ID = res.user.id;
    const spark_data = req.body.selected_sparks;
    if (typeof spark_data === "object") {
      var user_data = [];
      if (spark_data.length > 0) {
        spark_data.forEach((element) => {
          user_data.push({
            userId: user_ID,
            sparkCategoryId: element.catId,
            sparkListId: element.subCatId,
          });
        });
        await user_spark
          .destroy({
            where: {
              userId: user_ID,
            },
          })
          .then(() => {
            user_spark.bulkCreate(user_data).then((saveD) => {
              if (saveD) {
                var allData = [];
                user_spark
                  .findAll({ where: { userId: user_ID } })
                  .then(async (data) => {
                    for (const userD of data) {
                      var catData = await spark_category.findOne({
                        where: { id: userD.sparkCategoryId },
                      });
                      var catList = await spark_list.findOne({
                        where: { id: userD.sparkListId },
                      });

                      allData.push({
                        catId: catData.id,
                        Category: catData.title,
                        subCatId: catList.id,
                        subCategory: catList.title,
                        icon: catData.icon,
                      });
                    }

                    response.send_json(
                      res,
                      true,
                      `Spark updated successfully!`,
                      CONSTANT.HTTP_SUCCESS,
                      allData
                    );
                  });
              } else {
                response.send_json(
                  res,
                  false,
                  `Spark is not updated!`,
                  CONSTANT.HTTP_SUCCESS
                );
              }
            });
          });
      } else {
        response.send_json(
          res,
          false,
          `Spark category and subcategories are required`,
          CONSTANT.HTTP_SUCCESS
        );
      }
    } else {
      response.send_json(
        res,
        false,
        `Data format is wrong`,
        CONSTANT.HTTP_SUCCESS
      );
    }
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
  }
};

//user sparks visibility manage by user

exports.visibility = async (req, res) => {
  try {
    const userId = res.user.id;
    const userS = await user_spark.findAll({
      where: { userId: userId, isVisible: "1" },
    });
    
    const getN = await user_spark.findAll({
      where: { userId: userId, isVisible: "0" },
    });
   
    if (userS.length > 0) {
        const pro = { visibility: false };
      const hh = await user_spark.update(
        { isVisible: "0" },
        {
          where: { userId: userId },
        }
      );
      if (hh) {
        response.send_json(
          res,
          true,
          `Sparks visibility OFF successfully!`,
          CONSTANT.HTTP_SUCCESS,
          pro
        );
      }
    }else if (getN.length > 0) {
        const pro = { visibility: true };
      const uu = await user_spark.update(
        { isVisible: "1" },
        {
          where: { userId: userId },
        }
      );
      if (uu) {
        response.send_json(
          res,
          true,
          `Sparks visibility ON successfully!`,
          CONSTANT.HTTP_SUCCESS,
          pro
        );
      }
    } else {
      response.send_json(
        res,
        false,
        `Sparks is not added!`,
        CONSTANT.HTTP_SUCCESS
      );
    }
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
  }
};
