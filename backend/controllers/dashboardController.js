const { Op } = require('sequelize');
const { Task, Project, ProjectMember, User } = require('../models');

exports.getDashboard = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    let taskWhere = {};

    if (!isAdmin) {
      const memberProjects = await ProjectMember.findAll({ where: { userId: req.user.id }, attributes: ['projectId'] });
      const projectIds = memberProjects.map(pm => pm.projectId);
      taskWhere = { [Op.or]: [{ assigneeId: req.user.id }, { projectId: { [Op.in]: projectIds } }] };
    }

    const totalTasks = await Task.count({ where: taskWhere });
    const todoTasks = await Task.count({ where: { ...taskWhere, status: 'TODO' } });
    const inProgressTasks = await Task.count({ where: { ...taskWhere, status: 'IN_PROGRESS' } });
    const doneTasks = await Task.count({ where: { ...taskWhere, status: 'DONE' } });

    const today = new Date().toISOString().split('T')[0];
    const overdueTasks = await Task.findAll({
      where: { ...taskWhere, status: { [Op.ne]: 'DONE' }, dueDate: { [Op.lt]: today, [Op.ne]: null } },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] }
      ],
      order: [['dueDate', 'ASC']],
      limit: 10
    });

    const recentTasks = await Task.findAll({
      where: taskWhere,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    let projectCount = 0;
    let userCount = 0;
    if (isAdmin) {
      projectCount = await Project.count();
      userCount = await User.count();
    } else {
      const mp = await ProjectMember.findAll({ where: { userId: req.user.id } });
      projectCount = mp.length;
    }

    res.json({
      stats: { totalTasks, todoTasks, inProgressTasks, doneTasks, projectCount, userCount },
      overdueTasks,
      recentTasks
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
