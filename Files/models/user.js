const Sequelize = require('sequelize');

module.exports = class User extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      email: {
        type: Sequelize.STRING(40),
        allowNull: true,
        unique: true,
      },
      nick: {
        type: Sequelize.STRING(15),
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      provider: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'local',
      },
      snsId: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },
    }, {
      sequelize,
      timestamps: true, // true 이면 createdAt, updatedAt 컬럼 자동 생성
      underscored: false, // camel case(createdAt) 로 생성되는 컬럼을 snake case(created_at)으로 생성
      modelName: 'User', // 모듈 이름
      tableName: 'users', // 테이블 이름
      paranoid: true, // true 이면 deleteAt 컬럼 자동 생성
      charset: 'utf8',
      collate: 'utf8_general_ci',
    });
  }

  static associate(db) {
    db.User.hasMany(db.Post);
    db.User.belongsToMany(db.User, {
      foreignKey: 'followingId',
      as: 'Followers',
      through: 'Follow',
    });
    db.User.belongsToMany(db.User, {
      foreignKey: 'followerId',
      as: 'Followings',
      through: 'Follow',
    });
    db.User.hasMany(db.Comment);
    db.User.belongsToMany(db.Post, {through : "Likes", as : "Liking"});
  }
};
