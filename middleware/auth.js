const jwt = require("jsonwebtoken");
const response = require("../utils/http-response");
const CONSTANT = require("../constant/config");
const { users } = require("../database/db");

module.exports = (req, res, next) => {
  let token = req.headers["authorization"];
  if (token) {
    let authHeader = token.split(" ");
    if (authHeader[1]) {
      jwt.verify(authHeader[1], process.env.API_KEY, async(err, decoded) => {
        if (err) {
          response.send_json(res, false, err, CONSTANT.HTTP_UNAUTHORIZED);
        } else {
          res.user = decoded.user;
          const e_get = await users.findOne({where:{user_id:res.user.user_id}});
          
          if(e_get){
            if(e_get.status == "1"){
              next();
            }else{
              response.send_json(
                res,
                false,
                `Not Authorise`,
                CONSTANT.HTTP_FORBIDDEN
              );
            }        
           
          }else{
            response.send_json(
              res,
              false,
              `Not Authorise`,
              CONSTANT.HTTP_UNAUTHORIZED
            );
          }
        
        }
      });
    }
  } else {
    response.send_json(
      res,
      false,
      `Token is missing you are not authorise`,
      CONSTANT.HTTP_UNAUTHORIZED
    );
  }
};
