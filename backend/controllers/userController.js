const { User } = require('../models');

// Get all users (Admin only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(users);
  } catch (error) {
    console.error('GetUsers error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Update user role (Admin only)
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'MEMBER'].includes(role)) {
      return res.status(400).json({ message: 'Role must be ADMIN or MEMBER.' });
    }

    // Cannot change own role
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot change your own role.' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.role = role;
    await user.save();

    res.json({
      message: 'User role updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('UpdateRole error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};
