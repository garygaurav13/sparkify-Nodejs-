module.exports = (app) => {
    const faqs = require("../controllers/faq.controller");    
    const { check, validationResult } = require("express-validator");
    const isAuthorise = require("../middleware/auth");
    
  
    var router = require("express").Router();
//get all faqs
 router.get("/",faqs.getAll);




    // calling report endpoint using router
  app.use("/api/faqs", router);
};