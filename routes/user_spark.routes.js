module.exports = app => {
    const user_sparks = require("../controllers/userSpark.controller");

    const validateUser = require("../middleware/formValidate");
    const isAuthorise = require("../middleware/auth");
    const {check, validationResult} = require('express-validator');

    var router = require("express").Router();

    //add new sparks
    router.post("/",isAuthorise, user_sparks.create);

    //get user sparks
    router.get("/",isAuthorise, user_sparks.get);

    //update user sparks
    router.post("/spark-visibility",isAuthorise, user_sparks.visibility);

     // calling user sparks endpoint using router
     app.use('/api/user_sparks', router);
}