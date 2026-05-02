const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Project name is required' },
      len: { args: [2, 200], msg: 'Project name must be between 2 and 200 characters' }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'COMPLETED', 'ARCHIVED'),
    defaultValue: 'ACTIVE',
    allowNull: false
  }
}, {
  tableName: 'projects',
  timestamps: true
});

module.exports = Project;
