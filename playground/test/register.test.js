const http = require('http');
const supertest = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');
const { Cookie } = require('cookiejar');

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

  it('Manually persisting cookies and redirecting works!', function (done) {
    let cookie;
    supertest('http://localhost:3000')
      .post('/auth/register')
      .send({
        username: 'rlabuonora',
        email: 'rlabuonora@yahoo.com',
        password: 'Montevideo',
        confirmPassword: 'Montevideo',
      })
      .end(function (err, res) {
        cookie = res.headers['set-cookie'];
        const res2 = supertest('http://localhost:3000')
          .get('/auth/login')
          .set('cookie', cookie)
          .end((err, res) => {
            const actual = getAlert(res);
            expect(actual).to.eq('Your account was created!');
          });

        done();
      });
  });

  // Idea: start app manually and send to localhost:3000
  xit('Shows correct message when creating user', async function () {
    const res = await supertest
      .agent('http://localhost:3000')
      .post('/auth/register')
      .send({
        username: 'rlabuonora',
        email: 'rlabuonora@yahoo.com',
        password: 'Montevideo',
        confirmPassword: 'Montevideo',
      })
      .redirects(1);

    console.log(res.headers['set-cookie']);
    //console.log(res.text);
  });

  xit('Show message with existing user', async function () {
    const res = await supertest
      .agent('http://localhost:3000')
      .post('/auth/register')
      .send(validCredentials)
      .redirects(1);

    expect(res.text).to.match(
      /The given email address or the username exist already!/
    );
  });

  xit('Sanitizes username and email', async function () {
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
