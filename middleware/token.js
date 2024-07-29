require("dotenv").config();
const response = require("../utils/http-response");
module.exports = function (req, res, next) {
  if (req.headers["x-api-key"]) {
    const headers = req.headers;
    
    if (headers["x-api-key"] != process.env.API_KEY) {

        response.unauthorized(res, "Invalid request token expired");
    }
    next();
  } else {
    response.unauthorized(res, "Api key missing");
  }
};
