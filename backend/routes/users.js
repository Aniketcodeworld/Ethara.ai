const router = require('express').Router();
const { getUsers, updateRole } = require('../controllers/userController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

router.get('/', auth, roleCheck('ADMIN'), getUsers);
router.put('/:id/role', auth, roleCheck('ADMIN'), updateRole);

module.exports = router;
