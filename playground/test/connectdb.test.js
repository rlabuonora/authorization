const http = require('http');
const supertest = require('supertest');
const { expect } = require('chai');
const mongoose = require('mongoose');

require('dotenv').config();

const env = process.env.NODE_ENV;
const config = require('../server/config')[env];

const app = require('../server/app')(config);

// const server = http.createServer(app);

describe('Not connected', function () {
  it('Shows message', async function () {
    const res = await supertest(app).get('/'); // supertest(server) ?
    expect(res.text).to.match(/Failed to connect to MongoDB/);
  });
});

describe('Connected', function () {
  before(async function () {
    await mongoose.connect(config.database.dsn, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
    config.database.status.connected = true;
  });

  after(async function () {
    await mongoose.disconnect();
  });

  it('Shows correct message', async function () {
    const res = await supertest(app).get('/');
    expect(res.text).to.match(/Connected to MongoDB/);
  });
});
