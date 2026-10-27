const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['Reported', 'Acknowledged', 'In Progress', 'Resolved', 'Closed'],
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const issueSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      default: () => {
        const randomSuffix = Math.floor(100 + Math.random() * 900);
        return `CF-${Date.now().toString().slice(-6)}${randomSuffix}`;
      },
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Wi-Fi', 'Laboratory', 'Classrooms', 'Hostels', 'Cleanliness', 'Electricity', 'Other'],
      required: true,
    },
    building: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: String,
      default: '',
      trim: true,
    },
    room: {
      type: String,
      default: '',
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Reported', 'Acknowledged', 'In Progress', 'Resolved', 'Closed'],
      default: 'Reported',
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    attachments: [String],
    votes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    statusHistory: [statusHistorySchema],
    resolvedAt: Date,
    closedAt: Date,
  },
  { timestamps: true }
);

issueSchema.index({ status: 1, category: 1, priority: 1, createdAt: -1 });
issueSchema.index({ title: 'text', description: 'text', building: 'text', room: 'text' });
issueSchema.index({ reportedBy: 1 });
issueSchema.index({ assignedTo: 1 });
issueSchema.index({ department: 1 });

issueSchema.pre('validate', function () {
  if (!this.ticketNumber) {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    this.ticketNumber = `CF-${Date.now().toString().slice(-6)}${randomSuffix}`;
  }
});

module.exports = mongoose.model('Issue', issueSchema);
