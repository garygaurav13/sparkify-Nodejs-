require("dotenv").config();
const { spark_category, spark_list } = require("../database/db");
const response = require("../utils/http-response");
const CONSTANT = require("../constant/config");

//get sparks
exports.get = async (req, res) => {
  try {
    const allData = await spark_category.findAll({
      include: [{model:spark_list,attributes:['id','title','status'],where:{status:'active'}}],
      attributes:['id','title','icon','serial_number'],
      order: [
        ['serial_number', 'ASC'],
        [{ model: spark_list }, 'title', 'ASC']
        ], 
        where:{status:'active'}     
    });

    if (allData) {     
      response.send_json(
        res,
        true,
        "Sparks is get successfully.",
        CONSTANT.HTTP_SUCCESS,
        allData
      );
    } else {
      response.send_json(
        res,
        false,
        `Sparks record is not found`,
        CONSTANT.HTTP_SERVER_ERROR
      );
    }
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
  }
};

//get selected spark

exports.findOne =async (req, res) => {
  try {
    let id=req.params.id;
    const data = await spark_category.findByPk(id,{
        include: [spark_list],
      });
      if(data){
        var alls =[];
        for (const d of data) {       
          var l_data = d.spark_lists;
          for(const lists of l_data) {
            alls.push({
            catId: d.id,
            Category: d.title,
            subCatId: lists.id,
            subCategory: lists.title,
            icon: d.icon,
          });
          }
        }
        response.send_json(
            res,
            true,
            `Spark get successfully`,
            CONSTANT.HTTP_SERVER_ERROR,
            data
          );
      }else{
        response.send_json(
            res,
            false,
            `Sparks record is not found`,
            CONSTANT.HTTP_SERVER_ERROR
          );
      }
  } catch (err) {
    response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
  }
};
