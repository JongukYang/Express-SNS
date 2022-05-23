const Sequelize = require('sequelize');

module.exports = class Comment extends Sequelize.Model {
  static init(sequelize) {
    return super.init({
      content: {
        type: Sequelize.STRING(140),
        allowNull: true,
      },
    }, {
      sequelize,
      timestamps: true,
      underscored: false,
      modelName: 'Comment',
      tableName: 'comment',
      paranoid: false,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    });
  }

  static associate(db) {
    db.Comment.belongsTo(db.Post);
    db.Comment.belongsTo(db.User, { as: "Commenter" });
    // db.Comment.hasMany(db.Post);
  }
};
