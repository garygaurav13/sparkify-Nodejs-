var originsWhitelist = [
  'http://localhost:3000',
  'http://localhost:9191',
  'http://localhost:8000',
  'https://sparkifypwa.kloudexpert.com',
  'https://sparkify.com',
  'http://*/*',
  'https://*/*'
];

module.exports = {
  corsOptions: {
    origin: function (origin, callback) {
      var isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
      callback(null, isWhitelisted);
    },
    credentials: true
  }
}
