const { z } = require('zod');
const Issue = require('../models/Issue');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const User = require('../models/User');

const issueSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  description: z.string().min(15, 'Description must be at least 15 characters long.'),
  category: z.enum(['Wi-Fi', 'Laboratory', 'Classrooms', 'Hostels', 'Cleanliness', 'Electricity', 'Other']),
  building: z.string().min(2, 'Building is required.'),
  floor: z.string().optional().default(''),
  room: z.string().optional().default(''),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional().default('Medium'),
  department: z.string().optional(),
});

const statusTransitions = {
  Reported: ['Acknowledged'],
  Acknowledged: ['In Progress'],
  'In Progress': ['Resolved'],
  Resolved: ['Closed', 'Reported'],
  Closed: ['Reported', 'Resolved'],
};

const createIssueNotification = async ({ recipient, issue, type, message }) => {
  if (!recipient || !issue) return;
  try {
    await Notification.create({
      recipient,
      issue,
      type,
      message,
    });
  } catch (err) {
    console.error('Error creating notification:', err.message);
  }
};

const checkDuplicates = async (req, res) => {
  try {
    const { category, building, title } = req.query;
    const query = {
      status: { $nin: ['Resolved', 'Closed'] },
    };

    const conditions = [];

    if (category) {
      conditions.push({ category });
    }

    if (building && building.trim()) {
      conditions.push({ building: { $regex: building.trim(), $options: 'i' } });
    }

    if (title && title.trim().length >= 3) {
      const words = title.trim().split(/\s+/).filter((w) => w.length > 2);
      if (words.length > 0) {
        conditions.push({
          $or: words.map((w) => ({
            $or: [
              { title: { $regex: w, $options: 'i' } },
              { description: { $regex: w, $options: 'i' } },
            ],
          })),
        });
      }
    }

    if (conditions.length === 0) {
      return res.json({ duplicates: [] });
    }

    query.$or = conditions;

    const duplicates = await Issue.find(query)
      .select('ticketNumber title description category building floor room priority status votes createdAt')
      .populate('reportedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(6);

    return res.json({
      duplicates: duplicates.map((d) => ({
        ...d.toJSON(),
        votesCount: d.votes ? d.votes.length : 0,
        hasVoted: req.user ? (d.votes || []).some((v) => v.toString() === req.user._id.toString()) : false,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error checking for duplicate issues.' });
  }
};

const getIssues = async (req, res) => {
  try {
    const query = {};
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    const sortBy = req.query.sort || 'createdAt';
    const order = req.query.order === 'asc' ? 1 : -1;

    if (req.query.search) {
      const searchTerm = req.query.search.trim();
      query.$or = [
        { ticketNumber: { $regex: searchTerm, $options: 'i' } },
        { title: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { building: { $regex: searchTerm, $options: 'i' } },
        { room: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
    if (req.query.category && req.query.category !== 'all') query.category = req.query.category;
    if (req.query.priority && req.query.priority !== 'all') query.priority = req.query.priority;
    if (req.query.building && req.query.building !== 'all') query.building = { $regex: req.query.building, $options: 'i' };

    if (req.query.mine === 'true') {
      if (req.user.role === 'student') {
        query.reportedBy = req.user._id;
      } else if (req.user.role === 'staff') {
        query.assignedTo = req.user._id;
      }
    }

    if (req.user.role === 'staff' && req.query.department === 'mine' && req.user.department) {
      query.department = req.user.department;
    }

    const total = await Issue.countDocuments(query);
    const issues = await Issue.find(query)
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('department', 'name')
      .sort({ [sortBy]: order })
      .skip((page - 1) * limit)
      .limit(limit);

    const issuesWithVotes = issues.map((issue) => {
      const issueObj = issue.toJSON();
      issueObj.votesCount = (issue.votes || []).length;
      issueObj.hasVoted = (issue.votes || []).some((v) => v.toString() === req.user._id.toString());
      return issueObj;
    });

    return res.json({
      issues: issuesWithVotes,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error fetching issues.' });
  }
};

const createIssue = async (req, res) => {
  try {
    const payload = issueSchema.parse(req.body);

    const attachments = (req.files || []).map((file) => `/uploads/${file.filename}`);

    const issue = await Issue.create({
      ...payload,
      reportedBy: req.user._id,
      attachments,
      department: payload.department || null,
      status: 'Reported',
      statusHistory: [
        {
          status: 'Reported',
          changedBy: req.user._id,
          changedAt: new Date(),
          note: 'Initial report submitted by student.',
        },
      ],
    });

    await issue.populate('reportedBy', 'name email role');
    if (issue.department) {
      await issue.populate('department', 'name');
    }

    // Notify admins that a new issue was reported
    const admins = await User.find({ role: 'admin' }).select('_id');
    await Promise.all(
      admins.map((admin) =>
        createIssueNotification({
          recipient: admin._id,
          issue: issue._id,
          type: 'status',
          message: `New issue ${issue.ticketNumber} reported in ${issue.building}.`,
        })
      )
    );

    const issueObj = issue.toJSON();
    issueObj.votesCount = 0;
    issueObj.hasVoted = false;

    return res.status(201).json({
      message: 'Issue reported successfully.',
      issue: issueObj,
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: error.issues[0]?.message || 'Invalid issue data.' });
    }
    return res.status(500).json({ message: error.message || 'Failed to create issue.' });
  }
};

const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('reportedBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('department', 'name')
      .populate({
        path: 'statusHistory.changedBy',
        select: 'name email role',
      });

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found.' });
    }

    const comments = await Comment.find({ issue: issue._id })
      .populate('author', 'name email role')
      .sort({ createdAt: 1 });

    const issueObj = issue.toJSON();
    issueObj.votesCount = (issue.votes || []).length;
    issueObj.hasVoted = (issue.votes || []).some((v) => v.toString() === req.user._id.toString());

    return res.json({ issue: issueObj, comments });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error fetching issue.' });
  }
};

const updateIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found.' });
    }

    const isReporter = req.user._id.toString() === issue.reportedBy.toString();
    const isAssigned = issue.assignedTo && req.user._id.toString() === issue.assignedTo.toString();
    const isAdmin = req.user.role === 'admin';
    const isStaff = req.user.role === 'staff';

    if (!isReporter && !isAssigned && !isAdmin && !isStaff) {
      return res.status(403).json({ message: 'You cannot edit this issue.' });
    }

    // Only admin and staff can modify priority
    if (req.body.priority && !isAdmin && !isStaff) {
      delete req.body.priority;
    }

    const allowedFields = ['title', 'description', 'category', 'building', 'floor', 'room', 'priority'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        issue[field] = req.body[field];
      }
    });

    await issue.save();
    await issue.populate('reportedBy', 'name email role');
    await issue.populate('assignedTo', 'name email role');
    await issue.populate('department', 'name');

    return res.json({ message: 'Issue updated successfully.', issue });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error updating issue.' });
  }
};

const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found.' });
    }

    const isReporter = req.user._id.toString() === issue.reportedBy.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && (!isReporter || issue.status !== 'Reported')) {
      return res.status(403).json({ message: 'You can only delete your own issues before they are acknowledged.' });
    }

    await Comment.deleteMany({ issue: issue._id });
    await Notification.deleteMany({ issue: issue._id });
    await issue.deleteOne();

    return res.json({ message: 'Issue deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error deleting issue.' });
  }
};

const voteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found.' });
    }

    const userIdStr = req.user._id.toString();
    const existingIndex = issue.votes.findIndex((v) => v.toString() === userIdStr);

    let hasVoted = false;
    if (existingIndex > -1) {
      // Toggle off / remove vote
      issue.votes.splice(existingIndex, 1);
      hasVoted = false;
    } else {
      // Add vote
      issue.votes.push(req.user._id);
      hasVoted = true;
    }

    await issue.save();

    return res.json({
      message: hasVoted ? 'Your vote was recorded.' : 'Your vote was removed.',
      hasVoted,
      votesCount: issue.votes.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error voting on issue.' });
  }
};

const addComment = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found.' });
    }

    const message = (req.body.message || '').trim();
    if (!message) {
      return res.status(400).json({ message: 'Comment message is required.' });
    }

    const comment = await Comment.create({
      issue: issue._id,
      author: req.user._id,
      message,
    });

    await comment.populate('author', 'name email role');

    // Notify reporter and assignee
    const recipients = [issue.reportedBy, issue.assignedTo].filter(Boolean);
    const uniqueRecipients = [...new Set(recipients.map((id) => id.toString()))];

    await Promise.all(
      uniqueRecipients.map((recipientId) => {
        if (recipientId === req.user._id.toString()) return null;
        return createIssueNotification({
          recipient: recipientId,
          issue: issue._id,
          type: 'comment',
          message: `${req.user.name} added a comment on issue ${issue.ticketNumber}.`,
        });
      })
    );

    return res.status(201).json({ message: 'Comment added successfully.', comment });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error adding comment.' });
  }
};

const updateStatus = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found.' });
    }

    const requestedStatus = req.body.status;
    const allowedTransitions = statusTransitions[issue.status] || [];

    if (!requestedStatus || !allowedTransitions.includes(requestedStatus)) {
      return res.status(400).json({
        message: `Status transition from "${issue.status}" to "${requestedStatus}" is not permitted.`,
      });
    }

    const isReporter = req.user._id.toString() === issue.reportedBy.toString();
    const isStaff = req.user.role === 'staff';
    const isAdmin = req.user.role === 'admin';

    // Student reopening check:
    if (requestedStatus === 'Reported' && (issue.status === 'Resolved' || issue.status === 'Closed')) {
      if (!isReporter && !isAdmin && !isStaff) {
        return res.status(403).json({ message: 'Only the reporter or staff/admin can reopen this issue.' });
      }
    } else {
      // Regular status progression (Reported -> Acknowledged -> In Progress -> Resolved -> Closed) requires Staff or Admin
      if (!isAdmin && !isStaff) {
        return res.status(403).json({ message: 'Only staff or administrator can advance the issue status.' });
      }
    }

    issue.status = requestedStatus;
    const note = req.body.note?.trim() || `Status updated to ${requestedStatus} by ${req.user.name} (${req.user.role}).`;

    issue.statusHistory.push({
      status: requestedStatus,
      changedBy: req.user._id,
      changedAt: new Date(),
      note,
    });

    if (requestedStatus === 'Resolved') {
      issue.resolvedAt = new Date();
    } else if (requestedStatus === 'Closed') {
      issue.closedAt = new Date();
    } else if (requestedStatus === 'Reported') {
      // Reopened
      issue.resolvedAt = null;
      issue.closedAt = null;
    }

    await issue.save();
    await issue.populate('reportedBy', 'name email role');
    await issue.populate('assignedTo', 'name email role');
    await issue.populate('department', 'name');
    await issue.populate({
      path: 'statusHistory.changedBy',
      select: 'name email role',
    });

    const notifType =
      requestedStatus === 'Resolved' ? 'resolved' : requestedStatus === 'Reported' ? 'reopened' : 'status';

    // Notify student reporter if change was made by someone else
    if (issue.reportedBy && issue.reportedBy._id.toString() !== req.user._id.toString()) {
      await createIssueNotification({
        recipient: issue.reportedBy._id,
        issue: issue._id,
        type: notifType,
        message: `Issue ${issue.ticketNumber} status was changed to "${requestedStatus}": ${note}`,
      });
    }

    // Notify assigned staff if change was made by someone else
    if (issue.assignedTo && issue.assignedTo._id.toString() !== req.user._id.toString()) {
      await createIssueNotification({
        recipient: issue.assignedTo._id,
        issue: issue._id,
        type: notifType,
        message: `Issue ${issue.ticketNumber} assigned to you was changed to "${requestedStatus}": ${note}`,
      });
    }

    const issueObj = issue.toJSON();
    issueObj.votesCount = (issue.votes || []).length;
    issueObj.hasVoted = (issue.votes || []).some((v) => v.toString() === req.user._id.toString());

    return res.json({ message: 'Issue status updated successfully.', issue: issueObj });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error updating status.' });
  }
};

const assignIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ message: 'Issue not found.' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ message: 'Only staff or admin can assign issues.' });
    }

    const { assigneeId, department } = req.body;
    if (!assigneeId && !department) {
      return res.status(400).json({ message: 'Provide either an assignee or a department.' });
    }

    if (assigneeId) {
      const assignee = await User.findById(assigneeId);
      if (!assignee || assignee.role !== 'staff') {
        return res.status(400).json({ message: 'Only staff members can be assigned to an issue.' });
      }
      issue.assignedTo = assigneeId;
      if (assignee.department && !department) {
        issue.department = assignee.department;
      }
    }

    if (department) {
      issue.department = department;
    }

    await issue.save();
    await issue.populate('reportedBy', 'name email role');
    await issue.populate('assignedTo', 'name email role');
    await issue.populate('department', 'name');

    if (issue.assignedTo) {
      await createIssueNotification({
        recipient: issue.assignedTo._id,
        issue: issue._id,
        type: 'assignment',
        message: `You have been assigned to issue ${issue.ticketNumber} (${issue.title}).`,
      });
    }

    const issueObj = issue.toJSON();
    issueObj.votesCount = (issue.votes || []).length;
    issueObj.hasVoted = (issue.votes || []).some((v) => v.toString() === req.user._id.toString());

    return res.json({ message: 'Issue assignment updated successfully.', issue: issueObj });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error assigning issue.' });
  }
};

module.exports = {
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
};
