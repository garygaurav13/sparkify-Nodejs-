module.exports = app => {
    const sparks = require("../controllers/spark.controller");

    var router = require("express").Router();
  
     //sparks get 
     router.get("/",sparks.get);
     
     //get selected spark
     router.get("/:id",sparks.findOne);

    // calling users endpoint using router
    app.use('/api/sparks', router);
  };