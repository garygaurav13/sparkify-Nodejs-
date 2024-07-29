
module.exports = {
  // Development Environment
  development: {
    database: {
      HOST: process.env.DEV_DB_HOST,
      USER: process.env.DEV_DB_USER,
      PASSWORD: process.env.DEV_DB_PASSWORD,
      DB: process.env.DEV_DB_NAME,
      dialect: process.env.DB_DIALECT
    },
  },

  // Production Environment
  production: {
    database: {
      HOST: process.env.PROD_DB_HOST,
      USER: process.env.PROD_DB_USER,
      PASSWORD: process.env.PROD_DB_PASSWORD,
      DB: process.env.PROD_DB_NAME,
      dialect: process.env.DB_DIALECT
    },
  },

   // HTTP Response Code
   HTTP_SUCCESS: 200,
   HTTP_CREATED: 201,
   HTTP_UNAUTHORIZED: 401,
   HTTP_NOT_FOUND: 404,
   HTTP_BAD_REQUEST: 400,
   HTTP_SERVER_ERROR: 500,
   HTTP_FORBIDDEN:403,

  // Email options
  email : {
    EMAIL_FROM_NAME : "Sparkify",
    forgot: {
      FORGOT_EMAIL_SUB : "Reset your password",
      FORGOT_EMAIL_RES_MSG : "Forgot email send successfully"
    }
  },

  // chat rooms messages
  NO_OF_MESSAGES_TO_RETRIEVE: 25
};
