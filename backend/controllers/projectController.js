const { Project, User, ProjectMember, Task } = require('../models');

// List projects (Admin: all, Member: only joined)
exports.getProjects = async (req, res) => {
  try {
    let projects;

    if (req.user.role === 'ADMIN') {
      projects = await Project.findAll({
        include: [
          { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: ['role'] } }
        ],
        order: [['createdAt', 'DESC']]
      });
    } else {
      projects = await Project.findAll({
        include: [
          { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
          { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: ['role'] } }
        ],
        where: {},
        order: [['createdAt', 'DESC']]
      });

      // Filter to only projects where user is a member
      const memberProjects = await ProjectMember.findAll({
        where: { userId: req.user.id },
        attributes: ['projectId']
      });
      const memberProjectIds = memberProjects.map(pm => pm.projectId);
      projects = projects.filter(p => memberProjectIds.includes(p.id));
    }

    // Add task counts
    const projectsWithCounts = await Promise.all(projects.map(async (project) => {
      const taskCount = await Task.count({ where: { projectId: project.id } });
      const completedCount = await Task.count({ where: { projectId: project.id, status: 'DONE' } });
      const pJson = project.toJSON();
      pJson.taskCount = taskCount;
      pJson.completedTaskCount = completedCount;
      return pJson;
    }));

    res.json(projectsWithCounts);
  } catch (error) {
    console.error('GetProjects error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Create project (Admin only)
exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      status: 'ACTIVE',
      createdBy: req.user.id
    });

    // Add creator as OWNER member
    await ProjectMember.create({
      projectId: project.id,
      userId: req.user.id,
      role: 'OWNER'
    });

    const fullProject = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: ['role'] } }
      ]
    });

    res.status(201).json(fullProject);
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('CreateProject error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get project details
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: ['role'] } },
        {
          model: Task, as: 'tasks',
          include: [
            { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
            { model: User, as: 'taskCreator', attributes: ['id', 'name', 'email'] }
          ]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Check membership for non-admin
    if (req.user.role !== 'ADMIN') {
      const isMember = await ProjectMember.findOne({
        where: { projectId: project.id, userId: req.user.id }
      });
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied. You are not a member of this project.' });
      }
    }

    res.json(project);
  } catch (error) {
    console.error('GetProject error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Only admin or project owner
    if (req.user.role !== 'ADMIN') {
      const membership = await ProjectMember.findOne({
        where: { projectId: project.id, userId: req.user.id, role: 'OWNER' }
      });
      if (!membership) {
        return res.status(403).json({ message: 'Access denied. Only admin or project owner can update.' });
      }
    }

    const { name, description, status } = req.body;
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (status && ['ACTIVE', 'COMPLETED', 'ARCHIVED'].includes(status)) project.status = status;

    await project.save();

    const updated = await Project.findByPk(project.id, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: ['role'] } }
      ]
    });

    res.json(updated);
  } catch (error) {
    console.error('UpdateProject error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Delete project (Admin only)
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Delete related tasks and members first
    await Task.destroy({ where: { projectId: project.id } });
    await ProjectMember.destroy({ where: { projectId: project.id } });
    await project.destroy();

    res.json({ message: 'Project deleted successfully.' });
  } catch (error) {
    console.error('DeleteProject error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Add member to project
exports.addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const projectId = req.params.id;

    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Only admin or project owner
    if (req.user.role !== 'ADMIN') {
      const membership = await ProjectMember.findOne({
        where: { projectId, userId: req.user.id, role: 'OWNER' }
      });
      if (!membership) {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if already a member
    const existing = await ProjectMember.findOne({
      where: { projectId, userId }
    });
    if (existing) {
      return res.status(400).json({ message: 'User is already a member of this project.' });
    }

    await ProjectMember.create({
      projectId,
      userId,
      role: 'MEMBER'
    });

    const updated = await Project.findByPk(projectId, {
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'members', attributes: ['id', 'name', 'email'], through: { attributes: ['role'] } }
      ]
    });

    res.json(updated);
  } catch (error) {
    console.error('AddMember error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Remove member from project
exports.removeMember = async (req, res) => {
  try {
    const { id: projectId, userId } = req.params;

    const membership = await ProjectMember.findOne({
      where: { projectId, userId }
    });

    if (!membership) {
      return res.status(404).json({ message: 'Membership not found.' });
    }

    if (membership.role === 'OWNER') {
      return res.status(400).json({ message: 'Cannot remove the project owner.' });
    }

    // Unassign tasks from this member in this project
    await Task.update(
      { assigneeId: null },
      { where: { projectId, assigneeId: userId } }
    );

    await membership.destroy();

    res.json({ message: 'Member removed successfully.' });
  } catch (error) {
    console.error('RemoveMember error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
