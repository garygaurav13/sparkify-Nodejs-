module.exports = app => {
    const profile = require("../controllers/profile.controller");    

    const isApiKeyFound = require("../middleware/token");
    const isAuthorise = require("../middleware/auth"); 
    const profileValidate = require("../middleware/profileValidate");
    const paaswordValidate = require("../middleware/passwordchangevalidate");
    const multerMiddleware = require('../middleware/multer');
  
    var router = require("express").Router();

    //User Profile get     
    router.get("/",isAuthorise, profile.get);

    //get other user profile     
    router.get("/view_other_profile",isAuthorise, profile.view_other_profile);

    //create user profile
    router.post("/create",isAuthorise,profileValidate, profile.create);

     //User Profile update     
    router.put("/",isAuthorise, profile.edit);  

    //upload profile image
    router.put("/avatar", multerMiddleware("avatar"),isAuthorise, profile.avatar);  

    //change password
    router.put("/password",isAuthorise,paaswordValidate, profile.password); 

    //get all generation
    router.get("/generation", profile.generation);

    //profile visibilty managed by user
    router.post("/profile-visibility",isAuthorise,profile.visibility);

    // calling users endpoint using router
    app.use('/api/profile', router);
  };