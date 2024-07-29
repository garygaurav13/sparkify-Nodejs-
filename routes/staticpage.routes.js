module.exports = (app) => {
    const static_pages = require("../controllers/staticPage.controller");    
    const { check, validationResult } = require("express-validator");
    const isAuthorise = require("../middleware/auth");
    
  
    var router = require("express").Router();
//get all faqs
 router.get("/",static_pages.getAll);




    // calling report endpoint using router
  app.use("/api/static_pages", router);
};