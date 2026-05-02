const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProjectMember = sequelize.define('ProjectMember', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  role: {
    type: DataTypes.ENUM('OWNER', 'MEMBER'),
    defaultValue: 'MEMBER',
    allowNull: false
  }
}, {
  tableName: 'project_members',
  timestamps: true
});

module.exports = ProjectMember;
