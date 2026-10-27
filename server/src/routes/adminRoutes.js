const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getAnalytics,
  getUsers,
  getStaff,
  updateUserRole,
  updateUserStatus,
  getDepartments,
  createDepartment,
  deleteDepartment,
} = require('../controllers/adminController');

const router = express.Router();
router.use(requireAuth, requireRole('admin'));

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.get('/staff', getStaff);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);
router.get('/departments', getDepartments);
router.post('/departments', createDepartment);
router.delete('/departments/:id', deleteDepartment);

module.exports = router;
