const {check, validationResult} = require('express-validator');
const response = require("../utils/http-response");
const CONSTANT = require("../constant/config");
module.exports =[    
                check('firstname').trim().not().isEmpty().withMessage("Firstname field is required!")               
                .bail(),
                check('lastname').trim().not().isEmpty().withMessage("Lastname field is required!")               
                .bail(),
                check('occupation').trim().not().isEmpty().withMessage("Occupation field is required!")               
                .bail(),
                check('address.formatted_address').trim().not().isEmpty().withMessage("Address field is required!")               
                .bail(),
                check('address.place_id').trim().not().isEmpty().withMessage("Place id field is required!")               
                .bail(),
                check('address.latitude').trim().not().isEmpty().withMessage("Latitude field is required!")               
                .bail(),
                check('address.longitude').trim().not().isEmpty().withMessage("Longitude field is required!")               
                .bail(),
                check('generation').trim().not().isEmpty().withMessage("Genaration field is required!")               
                .bail(),                
                check('birthday').trim().not().isEmpty().withMessage("Day field is required!")               
                .bail(),
                check('birthmonth').trim().not().isEmpty().withMessage("Month field is required!")               
                .bail()
                    ,(req, res, next) => {  
                            const errors = validationResult(req);
    
                            if (!errors.isEmpty()){
                                response.send_json(res, false, errors, CONSTANT.HTTP_BAD_REQUEST);
                            }else{
                                next();
                            }                                  
                                
                    },
                ];
