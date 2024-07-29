require("dotenv").config();
const { faq } = require("../database/db");
const response = require("../utils/http-response");
const CONSTANT = require("../constant/config");

//get all faqs
exports.getAll = async (req, res) => {
    try {
        const feq = await faq.findAll({attributes:{exclude:['createdAt','updatedAt']},where:{status:"active"}});
        if(feq){
            response.send_json(
                res,
                true,
                `Successfully get.`,
                CONSTANT.HTTP_SUCCESS,
                feq                      
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
