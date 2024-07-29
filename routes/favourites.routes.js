module.exports = app => {
    const favourites = require("../controllers/favourite.controller");
    const isAuthorise = require("../middleware/auth"); 

    var router = require("express").Router();
  
     //favourite profiles get 
     router.get("/",isAuthorise,favourites.get);

     //add favourite profiles
     router.post("/",isAuthorise,favourites.create);

    // calling favourite endpoint using routers
    app.use('/api/favourites', router);
  };