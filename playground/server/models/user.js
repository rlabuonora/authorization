const { Model } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    validPassword(password) {
      return bcrypt.compare(password, this.password);
    }
  }
  User.init(
    {
      username: DataTypes.STRING,
      password: DataTypes.STRING,
      email: DataTypes.STRING,
      verified: DataTypes.BOOLEAN,
      verificationToken: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: 'User',
    }
  );
  User.addHook('beforeCreate', async (user, options) => {
    const hashedPassword = await bcrypt.hash(user.password, 12);
    user.password = hashedPassword;
  });
  return User;
};
