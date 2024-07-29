//  Reset token validate
const { Op } = require("sequelize");
const { sequelize_connect, reset_token } = require("../database/db");
const response = require("../utils/http-response");
const CONSTANT = require("../constant/config");
async function validateResetToken(req, res, next) {
  // destroy all expiry token
  await reset_token.destroy({
    where: {
      expiration: { [Op.lt]: new Date() },
    },
  });

  const user_id = req.body.user_id;
  const resetToken = req.body.reset_token;

  //find the token
  const record = await reset_token.findOne({
    where: {
      user_id: user_id,
      expiration: { [Op.gt]: sequelize_connect.fn("CURDATE") },
      token: resetToken,
      used: 0,
    },
  });

  if (record === null) {
    response.send_json(
      res,
      false,
      "Reset link expired. Please try reset password again.",
      CONSTANT.HTTP_SUCCESS
    );
    return;
  }
  next();
}
module.exports = validateResetToken;
