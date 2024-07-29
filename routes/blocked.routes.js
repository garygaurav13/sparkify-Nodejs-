module.exports = app => {
    const blocked = require("../controllers/blocked.controller");
    const isAuthorise = require("../middleware/auth"); 

    var router = require("express").Router();
  
     //blocked profiles get 
     router.get("/",isAuthorise,blocked.get);
    //block a profile 
    router.post("/",isAuthorise,blocked.create);

    // calling blocked endpoint using router
    app.use('/api/blocked', router);
  };