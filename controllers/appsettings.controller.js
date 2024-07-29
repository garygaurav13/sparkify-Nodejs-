require("dotenv").config();
const { users, spark_category, spark_list, generation } = require("../database/db");
const response = require("../utils/http-response");
const CONSTANT = require("../constant/config");

//get all data from sparks and generations
exports.getAll=async (req,res)=>{
try {
    const sparkCat = await spark_category.findAll({
        include: [{model:spark_list,attributes:['id','title','status'],where:{status:'active'}}],
        attributes:['id','title','icon','serial_number'],
        order: [
          ['serial_number', 'ASC'],
          [{ model: spark_list }, 'title', 'ASC']
          ],
          where:{status:'active'}       
      });
      const allgen = await generation.findAll({attributes:['value','title']});
      var allData={
            sparks:sparkCat,
            generation:allgen
      };
      if(sparkCat || allgen){
        response.send_json(
            res,
            true,
            `App Settings get successfully`,
            CONSTANT.HTTP_SUCCESS,
            allData
          );
      }else{
        response.send_json(
            res,
            true,
            `App Settings not found`,
            CONSTANT.HTTP_SUCCESS            
          );
      }
   
} catch (err) {
    response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);  
}
}