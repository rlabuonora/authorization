const http = require('http');
const supertest = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');

const { getAlert } = require('./utils');
const UserService = require('../server/services/UserService');

require('dotenv').config();

const env = process.env.NODE_ENV;
const config = require('../server/config')[env];

const models = require('../server/models');

config.sequelize = models.sequelize;

const app = require('../server/app')(config);

// const server = http.createServer(app);

describe('Connected', function foo() {
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

    // create user with valid credentials and verify!

    const db = mongoose.connection;
    db.dropDatabase(function (err) {
      if (err) {
        console.log('Error dropping database: ', err);
      } else {
        console.log('Successfully dropped database');
      }
    });

    // create user with valid credentials
    await supertest
      .agent(app)
      .post('/auth/register')
      .send(validCredentials)
      .redirects(1);

    // verify user
    const user = await UserService.findByEmail(validCredentials.email);
    if (!user) throw new Error('User not found');
    const verifyToken = user.verificationToken;
    const verifyUrl = `/auth/verify/${user.id}/${verifyToken}`;
    await supertest.agent(app).get(verifyUrl).redirects(1);
  });

  // disconnect
  after(async function () {
    await mongoose.disconnect();
    await models.sequelize.close();
  });

  it('With valid user', async function () {
    // supertest(app) does not work!
    const authenticated = supertest.agent(app);

    const res = await authenticated.post('/auth/login').send(validCredentials);
    const cookie = res.headers['set-cookie'];
    const redirectUrl = res.headers.location;
    const res2 = await supertest(app).get(redirectUrl).set('cookie', cookie);

    const alert = getAlert(res2);
    expect(alert).to.equal('You are logged in.');
    expect(res2.text).to.match(/Logout rlabuonora/);

    // Logout user
    const resLogout = await supertest(app)
      .get('/auth/logout')
      .set('cookie', cookie);
    const redirectUrl2 = resLogout.headers.location;

    const res3 = await supertest(app).get(redirectUrl2).set('cookie', cookie);

    const alert2 = getAlert(res3);
    expect(alert2).to.equal('You are logged out.');
    expect(res3.text).to.match(/Login/);
  });

  it('With non existing user', async function () {
    const res = await supertest
      .agent(app)
      .post('/auth/login')
      .send({ ...validCredentials, username: 'nonexisting' });

    const cookie = res.headers['set-cookie'];
    const redirectUrl = res.headers.location;
    const res2 = await supertest(app).get(redirectUrl).set('cookie', cookie);

    const actual = getAlert(res2);
    expect(actual).to.eq('Invalid username or email');
  });

  it('With wrong password', async function () {
    const res = await supertest
      .agent(app)
      .post('/auth/login')
      .send({ ...validCredentials, password: 'wrong' });

    const cookie = res.headers['set-cookie'];
    console.log(cookie);
    const redirectUrl = res.headers.location;
    const res2 = await supertest(app).get(redirectUrl).set('cookie', cookie);

    const actual = getAlert(res2);
    expect(actual).to.eq('Wrong password');
  });
});
