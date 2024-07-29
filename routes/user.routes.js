module.exports = (app) => {
  const users = require("../controllers/user.controller");
  const validateUser = require("../middleware/formValidate");
  const { check, validationResult } = require("express-validator");
  const isAuthorise = require("../middleware/auth");
  const validateResetToken = require("../middleware/validateResetToken");

  var router = require("express").Router();

  // Create a new user
  router.post("/register", validateUser, users.create);

  // Retrieve all Tutorials
  router.post("/", isAuthorise, users.findAll);

  // Retrieve a single user with id
  router.get("/:id",isAuthorise, users.findOne);

  // Update a single user with id
  router.put("/:id", users.update);

  // Delete a user with id
  router.delete("/:id", users.delete);

  //Login user
  router.post("/login", validateUser, users.login);
  



  //search user
  router.post(
    "/search",
    [check("name").notEmpty().withMessage("Name field is required")],
    isAuthorise,
    users.search
  );

  //forgot password user
  router.post(
    "/forgot-password",
    [
      check("email")
        .notEmpty()
        .withMessage("Email field is required")
        .isEmail()
        .withMessage("Email address is not valid"),
    ],
    users.forgotpassword
  );

  // reset password
  router.post(
    "/reset-password",
    [
      check("user_id")
        .notEmpty()
        .withMessage("User ID is required"),
        check("reset_token")
        .notEmpty()
        .withMessage("Reset Token is required"),
        validateResetToken
    ],
    users.resetpassword
  );


  //live location update
  router.post("/livelocation",
  isAuthorise,users.liveLocation);

  // calling users endpoint using router
  app.use("/api/users", router);
};
