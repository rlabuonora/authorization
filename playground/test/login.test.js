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
    const res = await supertest
      .agent(app)
      .post('/auth/login')
      .send({ ...validCredentials, username: 'nonexisting' })
      .redirects(1);

    expect(res.text).to.match(/Invalid username or email/);
  });

  it('With correct credentials', async function () {
    const authenticated = supertest.agent(app);

    const res = await authenticated
      .post('/auth/login')
      .send(validCredentials)
      .redirects(1);

    expect(res.text).to.match(/Please verify your account/);

    // verify user
    const user = await UserService.findByEmail(validCredentials.email);
    user.verified = true;
    await user.save();
    const verifiedUser = await UserService.findByEmail(validCredentials.email);
    expect(verifiedUser.verified).to.eq(true);

    const resVerified = await authenticated
      .post('/auth/login')
      .send(validCredentials)
      .redirects(1);

    expect(resVerified.text).to.match(/You are logged in./);
    expect(resVerified.text).to.match(/Logout rlabuonora/);

    // Logout user
    const resLogout = await authenticated.get('/auth/logout').redirects(1);
    // const res3 = await authenticated.get('/auth/logout').redirects(1);
    expect(resLogout.text).to.match(/You are logged out/);
  });

  it('With wrong password', async function () {
    const res = await supertest
      .agent(app)
      .post('/auth/login')
      .send({ ...validCredentials, password: 'wrong' })
      .redirects(1);

    expect(res.text).to.match(/Wrong password/);
  });
});
