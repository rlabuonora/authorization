const { expect } = require('chai');

const models = require('../server/models');

describe('User model', function () {
  before(async function () {
    await models.sequelize.sync({
      force: true,
    });
  });
  after(async function () {
    await models.sequelize.close();
  });

  const validCredentials = {
    username: 'rlabuonora',
    email: 'rlabuonora@yahoo.com',
    password: 'Montevideo',
    confirmPassword: 'Montevideo',
  };
  it('Is a function', async function () {
    expect(models.User).to.be.a('function');
    const users = await models.User.findAll();
    expect(users.length).to.eq(0);
  });
  it('Creates a user', async function () {
    const result = await models.User.create(validCredentials);
    const user = await models.User.findOne({
      where: { email: validCredentials.email },
    });
    expect(user instanceof models.User).to.eq(true);
    expect(user.username).to.eq(validCredentials.username);
    // missing expect (result?)
  });
  it('Validates password', async function () {
    const user = await models.User.findOne({
      where: { email: validCredentials.email },
    });
    const check = await user.validPassword(validCredentials.password);
    expect(check).to.eq(true);
  });
});
