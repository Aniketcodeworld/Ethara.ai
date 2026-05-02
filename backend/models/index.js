const sequelize = require('../config/db');
const User = require('./User');
const Project = require('./Project');
const ProjectMember = require('./ProjectMember');
const Task = require('./Task');

// Project creator
Project.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
User.hasMany(Project, { as: 'createdProjects', foreignKey: 'createdBy' });

// Project <-> User (many-to-many through ProjectMember)
Project.belongsToMany(User, { through: ProjectMember, as: 'members', foreignKey: 'projectId', otherKey: 'userId' });
User.belongsToMany(Project, { through: ProjectMember, as: 'projects', foreignKey: 'userId', otherKey: 'projectId' });

// Direct access to ProjectMember
Project.hasMany(ProjectMember, { foreignKey: 'projectId', as: 'projectMembers' });
ProjectMember.belongsTo(Project, { foreignKey: 'projectId' });
ProjectMember.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(ProjectMember, { foreignKey: 'userId' });

// Task belongs to project
Task.belongsTo(Project, { as: 'project', foreignKey: 'projectId' });
Project.hasMany(Task, { as: 'tasks', foreignKey: 'projectId' });

// Task assignee
Task.belongsTo(User, { as: 'assignee', foreignKey: 'assigneeId' });
User.hasMany(Task, { as: 'assignedTasks', foreignKey: 'assigneeId' });

// Task creator
Task.belongsTo(User, { as: 'taskCreator', foreignKey: 'createdBy' });
User.hasMany(Task, { as: 'createdTasks', foreignKey: 'createdBy' });

module.exports = {
  sequelize,
  User,
  Project,
  ProjectMember,
  Task
};
