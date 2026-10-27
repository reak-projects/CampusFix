const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  checkDuplicates,
  getIssues,
  createIssue,
  getIssueById,
  updateIssue,
  deleteIssue,
  voteIssue,
  addComment,
  updateStatus,
  assignIssue,
} = require('../controllers/issueController');

const router = express.Router();

router.use(requireAuth);

router.get('/check-duplicates', checkDuplicates);
router.get('/', getIssues);
router.post('/', upload.array('attachments', 5), createIssue);
router.get('/:id', getIssueById);
router.patch('/:id', updateIssue);
router.delete('/:id', deleteIssue);
router.post('/:id/vote', voteIssue);
router.post('/:id/comments', addComment);
router.patch('/:id/status', updateStatus);
router.post('/:id/assign', requireRole('admin', 'staff'), assignIssue);

module.exports = router;
