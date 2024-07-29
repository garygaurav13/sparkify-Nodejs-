module.exports = (app) => {
    const reports = require("../controllers/report.controller");    
    const { check, validationResult } = require("express-validator");
    const isAuthorise = require("../middleware/auth");
    
  
    var router = require("express").Router();

    // Create a new resport
  router.post("/",[check("report_user_id").notEmpty().withMessage("User id is required")],isAuthorise, reports.creation);

  //DISTNACE VISIBILITY MANAGED BYR USER
  router.post('/distance-visibility',isAuthorise, reports.visibility)




    // calling report endpoint using router
  app.use("/api/reports", router);
};