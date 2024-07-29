require("dotenv").config();
const { userreport, geolocation, sequelize } = require("../database/db");
const response = require("../utils/http-response");
const CONSTANT = require("../constant/config");
const { check, validationResult } = require("express-validator");


//create report
exports.creation = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      response.send_json(
        res,
        false,
        `Longitude and Latitude  is required`,
        CONSTANT.HTTP_SUCCESS
      );
      return;
    }
    const id = res.user.id;
    const { report_user_id, message } = req.body;
    const userdata = {
      userId: id,
      reported_user_id: report_user_id,
      message: message,
    };
    const data = await userreport.create(userdata);
    if (data) {
      response.send_json(
        res,
        true,
        `Reported successfully`,
        CONSTANT.HTTP_SUCCESS
      );
    } else {
      response.send_json(res, true, `Not repported`, CONSTANT.HTTP_SUCCESS);
    }
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
  }
};

//toggle show distance managed by user

exports.visibility = async (req, res) => {
  try {
    const user_id = res.user.user_id;
    const ge = await geolocation.findOne({
      attributes: ["isVisible"],
      where: { userId: user_id },
    });
    if(ge != null){    
    if (ge.isVisible == "1") {
      const upDats = await geolocation.update(
        { isVisible: "0" },
        { where: { userId: user_id } }
      );
      const s = { visible: false };
      if (upDats) {
        response.send_json(
          res,
          true,
          `Distance visibility OFF successfully`,
          CONSTANT.HTTP_SUCCESS,
          s
        );
      }
    } else {
      const upDats = await geolocation.update(
        { isVisible: "1" },
        { where: { userId: user_id } }
      );
      const s = { visible: true };
      if (upDats) {
        response.send_json(
          res,
          true,
          `Distance visibility ON successfully`,
          CONSTANT.HTTP_SUCCESS,
          s
        );
      }
    }
  }else{
    response.send_json(res, false, `Geolocation is not found`, CONSTANT.HTTP_SUCCESS);
  }
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
  }
};

