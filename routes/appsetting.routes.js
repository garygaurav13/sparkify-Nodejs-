module.exports = (app) => {
    const appsettings = require("../controllers/appsettings.controller");     
    
  
    var router = require("express").Router();

    // get user all settings
    router.get("/",appsettings.getAll);
    


    // calling report endpoint using router
  app.use("/api/appsettings", router);
};