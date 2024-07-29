require("dotenv").config();
const { staticpage } = require("../database/db");
const response = require("../utils/http-response");
const CONSTANT = require("../constant/config");

//get all faqs
exports.getAll = async (req, res) => {
    try {
        const pages = await staticpage.findAll({attributes:{exclude:['createdAt','updatedAt']},where:{status:"active"}});
        
        if(pages){
            response.send_json(
                res,
                true,
                `Successfully get.`,
                CONSTANT.HTTP_SUCCESS,
                pages                      
              );
        }else{
            response.send_json(
                res,
                true,
                `Not Found.`,
                CONSTANT.HTTP_SUCCESS                                    
              );
        } 
        
    } catch (err) {
        response.send_json(res, false, err, CONSTANT.HTTP_SERVER_ERROR);
    }
}