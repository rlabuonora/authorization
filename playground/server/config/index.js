const logger = require('pino')({ prettyPrint: true });
require('dotenv').config();

module.exports = {
  development: {
    port: 3000,
    database: {
      dsn:
        'mongodb+srv://rlabuonora:rlabuonora@cluster0.nezlieo.mongodb.net/authorization',
      status: {
        connected: false,
        error: false,
      },
    },
    JWTSECRET: process.env.JWTSECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    logger,
  },
  test: {
    port: 3001,
    database: {
      dsn:
        'mongodb+srv://rlabuonora:rlabuonora@cluster0.nezlieo.mongodb.net/authorization_test',
      status: {
        connected: false,
        error: false,
      },
    },
    JWTSECRET: process.env.JWTSECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    logger,
  },
};
