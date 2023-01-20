const http = require('http');
const supertest = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const { Cookie } = require('cookiejar');

const { getAlert } = require('./utils');

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
    const db = mongoose.connection;
    db.dropDatabase(function (err) {
      if (err) {
        console.log('Error dropping database: ', err);
      } else {
        console.log('Successfully dropped database');
      }
    });
  });

  // disconnect
  after(async function () {
    await mongoose.disconnect();
    await models.sequelize.close();
  });

  it('Manually persisting cookies and redirecting works', async function () {
    const res1 = await supertest(app).post('/auth/register').send({
      username: 'rlabuonora',
      email: 'rlabuonora@yahoo.com',
      password: 'Montevideo',
      confirmPassword: 'Montevideo',
    });

    const cookie = res1.headers['set-cookie'];
    const res2 = await supertest(app).get('/auth/login').set('cookie', cookie);

    const actual = getAlert(res2);
    expect(actual).to.eq('Your account was created!');
  });

  it('If the user exists', async function () {
    const res1 = await supertest(app).post('/auth/register').send({
      username: 'rlabuonora',
      email: 'rlabuonora@yahoo.com',
      password: 'Montevideo',
      confirmPassword: 'Montevideo',
    });

    const actual = getAlert(res1);
    expect(actual).to.eq(
      'The given email address or the username exist already!'
    );
  });

  it('If the username is too short', async function () {
    const res1 = await supertest(app).post('/auth/register').send({
      username: 'rlab',
      email: 'rlabuonora@yahoo.com',
      password: 'Montevideo',
      confirmPassword: 'Montevideo',
    });
    const actual = getAlert(res1);
    expect(actual).to.eq('The username has to be at least 6 characters long.');
  });

  it('If the email is not unique', async function () {
    const res1 = await supertest(app).post('/auth/register').send({
      username: 'rlabuonora2',
      email: 'rlabuonora@yahoo.com',
      password: 'Montevideo',
      confirmPassword: 'Montevideo',
    });
    const actual = getAlert(res1);
    expect(actual).to.eq(
      'The given email address or the username exist already!'
    );
  });

  it('If the email is not unique', async function () {
    const res1 = await supertest(app).post('/auth/register').send({
      username: 'rlabuonora2',
      email: 'RLABUONORA@yahoo.com',
      password: 'Montevideo',
      confirmPassword: 'Montevideo',
    });
    const actual = getAlert(res1);
    expect(actual).to.eq(
      'The given email address or the username exist already!'
    );
  });
  it('If the username is not trim is not unique', async function () {
    const res1 = await supertest(app).post('/auth/register').send({
      username: 'rlabuonora ',
      email: 'rlabuonora@yahoo.com',
      password: 'Montevideo',
      confirmPassword: 'Montevideo',
    });
    const actual = getAlert(res1);
    expect(actual).to.eq(
      'The given email address or the username exist already!'
    );
  });
});
