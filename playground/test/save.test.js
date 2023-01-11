const http = require('http');
const supertest = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');

const UserService = require('../server/services/UserService');

require('dotenv').config();

const env = process.env.NODE_ENV;
const config = require('../server/config')[env];

const app = require('../server/app')(config);

// const server = http.createServer(app);

describe('Connected', function () {
  this.timeout(10000);
  const validCredentials = {
    username: 'rlabuonora',
    email: 'rlabuonora@yahoo.com',
    password: 'Montevideo',
    confirmPassword: 'Montevideo',
  };
  // drop db
  before(async function () {
    await mongoose.connect(config.database.dsn, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    const db = mongoose.connection;
    db.dropDatabase(function (err) {
      if (err) {
        console.log('Error dropping database: ', err);
      } else {
        console.log('Successfully dropped database');
      }
    });
    // create user with credentials
    const res = await supertest
      .agent(app)
      .post('/auth/register')
      .send(validCredentials)
      .redirects(1);
  });

  // disconnect
  after(async function () {
    await mongoose.disconnect();
  });

  it('With non existing user', async function () {
    const user = await UserService.findByEmail(validCredentials.email);
    // console.log(`User: ${user}`);
    user.verified = true;
    // console.log(`User: ${user}`);
    console.log(user.isModified('verified'));
    console.log(mongoose.models);
    //await user.save();
    // expect(res.text).to.match(/Invalid username or email/);
  });
});
