const {check, validationResult} = require('express-validator');
const response = require("../utils/http-response");
const CONSTANT = require("../constant/config");
module.exports =[    
                check('email').trim().not().isEmpty().withMessage("Email name can not be empty!")
                .bail().isEmail().withMessage("Invalid email address!")
                .bail(),check('password').trim().not().isEmpty()
                .withMessage("Password can not be empty!")
                .bail().isLength({min: 6})
                .withMessage('Minimum 6 characters required!')
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
