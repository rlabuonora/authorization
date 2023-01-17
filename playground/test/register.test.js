const http = require('http');
const supertest = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');

const { getAlert } = require('./utils');

require('dotenv').config();

const env = process.env.NODE_ENV;
const config = require('../server/config')[env];

// const app = require('../server/app')(config);

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
  });

  // disconnect
  after(async function () {
    await mongoose.disconnect();
  });

  // Idea: start app manually and send to localhost:3000
  it('Shows correct message when creating user', async function () {
    const res = await supertest
      .agent('http://localhost:3000')
      .post('/auth/register')
      .send(validCredentials)
      .redirects(1);

    const actual = getAlert(res);

    expect(actual).to.eq('Your account was created!');
  });

  it('Show message with existing user', async function () {
    const res = await supertest
      .agent('http://localhost:3000')
      .post('/auth/register')
      .send(validCredentials)
      .redirects(1);

    expect(res.text).to.match(
      /The given email address or the username exist already!/
    );
  });

  it('Sanitizes username and email', async function () {
    const credentials = {
      ...validCredentials,
      username: 'elrafa',
      email: 'RLABUONORA@yahoo.com',
    };
    const res = await supertest
      .agent('http://localhost:3000')
      .post('/auth/register')
      .send(credentials)
      .redirects(1);

    expect(res.text).to.match(
      /The given email address or the username exist already!/
    );
  });
});
