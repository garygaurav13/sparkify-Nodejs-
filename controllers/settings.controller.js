require("dotenv").config();
const { users, user_spark, geolocation } = require("../database/db");
const response = require("../utils/http-response");
const CONSTANT = require("../constant/config");

//get user setting profile is vivible or not sparks and distance

exports.getAll=async(req, res)=>{
    try {
        var user_id = res.user.user_id;
        var userId = res.user.id;
        const uData = await users.findOne({attributes:['account_status'],where:{user_id:user_id}});
        const uSpark = await user_spark.findOne({attributes:['isVisible'],where:{userId:userId}});
        const uDistance = await geolocation.findOne({attributes:['isVisible'],where:{userId:user_id}});
        profile_status = 0;
        sparks_status = "0";
        distance_status = "0";

        if(uData != null){
            profile_status = uData.account_status;
        }
        if(uSpark != null){
            sparks_status = uSpark.isVisible;
        }
        if(uDistance != null){
            distance_status = uDistance.isVisible;
        }
        var settings={
            profile_status:profile_status,
            sparks_status:sparks_status,
            distance_status:distance_status,
        }
        response.send_json(
            res,
            true,
            `Settings get successfully`,
            CONSTANT.HTTP_SUCCESS,
            settings
          );
    } catch (err) {
        response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR); 
    }
}

