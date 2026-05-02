const router = require('express').Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { getProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember } = require('../controllers/projectController');

router.get('/', auth, getProjects);
router.post('/', auth, roleCheck('ADMIN'), createProject);
router.get('/:id', auth, getProject);
router.put('/:id', auth, updateProject);
router.delete('/:id', auth, roleCheck('ADMIN'), deleteProject);
router.post('/:id/members', auth, addMember);
router.delete('/:id/members/:userId', auth, removeMember);

module.exports = router;
