const { Task, User, Project, ProjectMember } = require('../models');

exports.getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findByPk(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (req.user.role !== 'ADMIN') {
      const isMember = await ProjectMember.findOne({ where: { projectId, userId: req.user.id } });
      if (!isMember) return res.status(403).json({ message: 'Access denied.' });
    }

    const tasks = await Task.findAll({
      where: { projectId },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'taskCreator', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(tasks);
  } catch (error) {
    console.error('GetTasks error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, priority, dueDate, assigneeId, status } = req.body;
    const project = await Project.findByPk(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found.' });

    if (req.user.role !== 'ADMIN') {
      const isMember = await ProjectMember.findOne({ where: { projectId, userId: req.user.id } });
      if (!isMember) return res.status(403).json({ message: 'Access denied.' });
    }

    const task = await Task.create({
      title, description, status: status || 'TODO', priority: priority || 'MEDIUM',
      dueDate: dueDate || null, projectId, assigneeId: assigneeId || null, createdBy: req.user.id
    });

    const fullTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'taskCreator', attributes: ['id', 'name', 'email'] }
      ]
    });
    res.status(201).json(fullTask);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: error.errors.map(e => e.message).join(', ') });
    }
    console.error('CreateTask error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    if (req.user.role !== 'ADMIN') {
      const isMember = await ProjectMember.findOne({ where: { projectId: task.projectId, userId: req.user.id } });
      if (!isMember) return res.status(403).json({ message: 'Access denied.' });
    }

    const { title, description, status, priority, dueDate, assigneeId } = req.body;
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (status && ['TODO', 'IN_PROGRESS', 'DONE'].includes(status)) task.status = status;
    if (priority && ['LOW', 'MEDIUM', 'HIGH'].includes(priority)) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (assigneeId !== undefined) task.assigneeId = assigneeId;
    await task.save();

    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'taskCreator', attributes: ['id', 'name', 'email'] }
      ]
    });
    res.json(updatedTask);
  } catch (error) {
    console.error('UpdateTask error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found.' });

    if (req.user.role !== 'ADMIN') {
      const ownership = await ProjectMember.findOne({ where: { projectId: task.projectId, userId: req.user.id, role: 'OWNER' } });
      if (!ownership) return res.status(403).json({ message: 'Access denied.' });
    }

    await task.destroy();
    res.json({ message: 'Task deleted successfully.' });
  } catch (error) {
    console.error('DeleteTask error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
