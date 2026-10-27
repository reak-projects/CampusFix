const { z } = require('zod');
const Department = require('../models/Department');
const Issue = require('../models/Issue');
const User = require('../models/User');

const departmentSchema = z.object({
  name: z.string().min(2, 'Department name is required.'),
  description: z.string().optional().default(''),
  staff: z.array(z.string()).optional().default([]),
});

const getAnalytics = async (_req, res) => {
  try {
    const totalIssues = await Issue.countDocuments();
    const openIssues = await Issue.countDocuments({ status: { $in: ['Reported', 'Acknowledged', 'In Progress'] } });
    const resolvedIssues = await Issue.countDocuments({ status: 'Resolved' });
    const closedIssues = await Issue.countDocuments({ status: 'Closed' });
    const overdueIssues = await Issue.countDocuments({
      status: { $in: ['Reported', 'Acknowledged', 'In Progress'] },
      createdAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    const avgResolutionResult = await Issue.aggregate([
      { $match: { resolvedAt: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: null,
          averageMs: { $avg: { $subtract: ['$resolvedAt', '$createdAt'] } },
        },
      },
    ]);

    const averageResolutionHours = avgResolutionResult[0]
      ? Number((avgResolutionResult[0].averageMs / (1000 * 60 * 60)).toFixed(1))
      : 0;

    const categoryBreakdown = await Issue.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const statusBreakdown = await Issue.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const monthlyVolume = await Issue.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const locationBreakdown = await Issue.aggregate([
      { $group: { _id: '$building', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    const staffWorkload = await User.aggregate([
      { $match: { role: 'staff' } },
      {
        $lookup: {
          from: 'issues',
          localField: '_id',
          foreignField: 'assignedTo',
          as: 'assignedIssues',
        },
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'departmentDoc',
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          department: { $arrayElemAt: ['$departmentDoc.name', 0] },
          assignedIssueCount: { $size: '$assignedIssues' },
          openIssueCount: {
            $size: {
              $filter: {
                input: '$assignedIssues',
                as: 'issue',
                cond: { $in: ['$$issue.status', ['Reported', 'Acknowledged', 'In Progress']] },
              },
            },
          },
          resolvedIssueCount: {
            $size: {
              $filter: {
                input: '$assignedIssues',
                as: 'issue',
                cond: { $in: ['$$issue.status', ['Resolved', 'Closed']] },
              },
            },
          },
        },
      },
      { $sort: { assignedIssueCount: -1 } },
    ]);

    const resolutionRate = totalIssues ? Number((((resolvedIssues + closedIssues) / totalIssues) * 100).toFixed(1)) : 0;

    return res.json({
      summary: {
        totalIssues,
        openIssues,
        resolvedIssues,
        closedIssues,
        overdueIssues,
        averageResolutionHours,
        resolutionRate,
      },
      categoryBreakdown,
      statusBreakdown,
      monthlyVolume,
      locationBreakdown,
      staffWorkload,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error compiling analytics data.' });
  }
};

const getUsers = async (_req, res) => {
  try {
    const users = await User.find().populate('department', 'name').sort({ createdAt: -1 });
    return res.json({ users });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error fetching users.' });
  }
};

const getStaff = async (_req, res) => {
  try {
    const staff = await User.find({ role: 'staff', isActive: true }).populate('department', 'name').sort({ name: 1 });
    return res.json({ staff });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error fetching staff.' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (req.user._id.toString() === targetUser._id.toString()) {
      return res.status(400).json({ message: 'You cannot change your own admin role.' });
    }

    const allowedRoles = ['student', 'staff', 'admin'];
    const role = req.body.role;
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected.' });
    }

    targetUser.role = role;
    if (req.body.department !== undefined) {
      targetUser.department = req.body.department || null;
    }
    await targetUser.save();

    return res.json({ message: 'User role updated.', user: targetUser });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error updating user role.' });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (req.user._id.toString() === targetUser._id.toString()) {
      return res.status(400).json({ message: 'You cannot deactivate your own admin account.' });
    }

    targetUser.isActive = req.body.isActive;
    await targetUser.save();

    return res.json({ message: 'User account status updated.', user: targetUser });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error updating account status.' });
  }
};

const getDepartments = async (_req, res) => {
  try {
    const departments = await Department.find().populate('staff', 'name email role');
    return res.json({ departments });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error fetching departments.' });
  }
};

const createDepartment = async (req, res) => {
  try {
    const payload = departmentSchema.parse(req.body);

    const existing = await Department.findOne({ name: payload.name.trim() });
    if (existing) {
      return res.status(409).json({ message: 'A department with this name already exists.' });
    }

    const department = await Department.create({
      name: payload.name.trim(),
      description: payload.description,
      staff: payload.staff,
    });

    // If staff members were provided, update their department field
    if (payload.staff && payload.staff.length > 0) {
      await User.updateMany({ _id: { $in: payload.staff } }, { department: department._id });
    }

    return res.status(201).json({ message: 'Department created successfully.', department });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: error.issues[0]?.message || 'Invalid department payload.' });
    }

    return res.status(500).json({ message: error.message || 'Failed to create department.' });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    // Unlink users
    await User.updateMany({ department: department._id }, { department: null });
    // Unlink issues
    await Issue.updateMany({ department: department._id }, { department: null });
    await department.deleteOne();

    return res.json({ message: 'Department deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error deleting department.' });
  }
};

module.exports = {
  getAnalytics,
  getUsers,
  getStaff,
  updateUserRole,
  updateUserStatus,
  getDepartments,
  createDepartment,
  deleteDepartment,
};
