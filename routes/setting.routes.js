module.exports = (app) => {
    const settings = require("../controllers/settings.controller");    
    const { check, validationResult } = require("express-validator");
    const isAuthorise = require("../middleware/auth");
    
  
    var router = require("express").Router();

    // get user all settings
    router.get("/",isAuthorise,settings.getAll);
    


    // calling report endpoint using router
  app.use("/api/settings", router);
};