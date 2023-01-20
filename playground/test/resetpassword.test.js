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

describe('Connected', function () {
  this.timeout(10000);
  const validCredentials = {
    username: 'rlabuonora',
    email: 'rlabuonora@yahoo.com',
    password: 'Montevideo',
    confirmPassword: 'Montevideo',
  };
  before(async function () {
    // connect to db
    await mongoose.connect(config.database.dsn, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });

    config.database.status.connected = true;

    // drop db
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
    const verifyToken = user.verificationToken;
    const verifyUrl = `/auth/verify/${user.id}/${verifyToken}`;
    const res = await supertest.agent(app).get(verifyUrl).redirects(1);
  });

  // disconnect
  after(async function () {
    await mongoose.disconnect();
    await models.sequelize.close();
  });

  it('With correct credentials', async function () {
    const res = await supertest(app).get('/auth/resetpassword');

    expect(res.text).to.match(/Reset password/);

    const res2 = await supertest
      .agent(app)
      .post('/auth/resetpassword')
      .send({
        email: validCredentials.email,
      })
      .redirects(1);

    expect(res2.text).to.match(/Token sent/);

    const user = await UserService.findByEmail(validCredentials.email);

    const token = await UserService.getResetToken(user.id);
    const resetUrl = `/auth/resetpassword/${user.id}/${token.token}`;

    const res3 = await supertest.agent(app).get(resetUrl);
    expect(res3.text).to.match(/Change password/);

    const passwordChange = await supertest
      .agent(app)
      .post(resetUrl)
      .send({ password: 'newpassword', confirmPassword: 'newpassword' });

    const cookie = passwordChange.headers['set-cookie'];
    const redirectUrl = passwordChange.headers.location;

    const res4 = await supertest
      .agent(app)
      .get(redirectUrl)
      .set('cookie', cookie);

    expect(res4.text).to.match(/Password changed/);
    // login with new credentials

    const loginUser = await supertest
      .agent(app)
      .post('/auth/login')
      .send({ username: validCredentials.username, password: 'newpassword' })
      .set('cookie', cookie);

    const redirectUrl2 = loginUser.headers.location;
    const foo = await supertest
      .agent(app)
      .get(redirectUrl2)
      .set('cookie', cookie);
    expect(foo.text).to.match(/Logout rlabuonora/);
  });
});
