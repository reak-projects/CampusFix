const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const User = require('./models/User');
const Department = require('./models/Department');
const Issue = require('./models/Issue');
const Comment = require('./models/Comment');
const Notification = require('./models/Notification');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedData = async () => {
  await connectDB();

  console.log('Clearing existing collections...');
  await Issue.deleteMany({});
  await User.deleteMany({});
  await Department.deleteMany({});
  await Comment.deleteMany({});
  await Notification.deleteMany({});

  console.log('Creating demo users...');
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const staffPassword = await bcrypt.hash('Staff@123', 10);
  const studentPassword = await bcrypt.hash('Student@123', 10);

  const admin = await User.create({
    name: 'Ava Admin',
    email: 'admin@campusfix.dev',
    passwordHash: adminPassword,
    role: 'admin',
    isActive: true,
  });

  const staffFacilities = await User.create({
    name: 'Noah Staff',
    email: 'staff@campusfix.dev',
    passwordHash: staffPassword,
    role: 'staff',
    isActive: true,
  });

  const staffElectrical = await User.create({
    name: 'Marcus Sparks',
    email: 'electrical@campusfix.dev',
    passwordHash: staffPassword,
    role: 'staff',
    isActive: true,
  });

  const staffIT = await User.create({
    name: 'Elena Vance',
    email: 'it@campusfix.dev',
    passwordHash: staffPassword,
    role: 'staff',
    isActive: true,
  });

  const studentSara = await User.create({
    name: 'Sara Student',
    email: 'student@campusfix.dev',
    passwordHash: studentPassword,
    role: 'student',
    isActive: true,
  });

  const studentAlex = await User.create({
    name: 'Alex Rivera',
    email: 'alex@campusfix.dev',
    passwordHash: studentPassword,
    role: 'student',
    isActive: true,
  });

  console.log('Creating departments...');
  const deptIT = await Department.create({
    name: 'IT & Networking',
    description: 'Campus internet connectivity, computer laboratories, and portal infrastructure.',
    staff: [staffIT._id],
  });

  const deptFacilities = await Department.create({
    name: 'Facilities & Maintenance',
    description: 'Physical campus infrastructure, furniture, classrooms, and HVAC.',
    staff: [staffFacilities._id],
  });

  const deptElectrical = await Department.create({
    name: 'Electrical & Power',
    description: 'Campus electrical grid, lighting, laboratory power outlets, and generators.',
    staff: [staffElectrical._id],
  });

  const deptSanitation = await Department.create({
    name: 'Sanitation & Cleanliness',
    description: 'Waste management, restrooms, and general campus hygiene.',
    staff: [],
  });

  // Assign staff department references
  staffIT.department = deptIT._id;
  await staffIT.save();

  staffFacilities.department = deptFacilities._id;
  await staffFacilities.save();

  staffElectrical.department = deptElectrical._id;
  await staffElectrical.save();

  console.log('Creating sample issues...');
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  // Issue 1: Wi-Fi outage (In Progress)
  const issue1 = await Issue.create({
    ticketNumber: 'CF-202610-101',
    title: 'Wi-Fi outage in Central Library Reading Hall',
    description: 'The Wi-Fi access point CF-LIB-AP04 drops frequently in the reading hall and students cannot access online learning resources.',
    category: 'Wi-Fi',
    building: 'Central Library',
    floor: '2nd Floor',
    room: 'Hall B',
    priority: 'High',
    status: 'In Progress',
    reportedBy: studentSara._id,
    assignedTo: staffIT._id,
    department: deptIT._id,
    votes: [studentSara._id, studentAlex._id],
    statusHistory: [
      { status: 'Reported', changedBy: studentSara._id, changedAt: new Date(now - 3 * dayMs), note: 'Initial report by student.' },
      { status: 'Acknowledged', changedBy: staffIT._id, changedAt: new Date(now - 2 * dayMs), note: 'Ticket reviewed by IT support.' },
      { status: 'In Progress', changedBy: staffIT._id, changedAt: new Date(now - 1 * dayMs), note: 'Replacing damaged fiber patch cable.' },
    ],
    createdAt: new Date(now - 3 * dayMs),
  });

  // Issue 2: Laboratory centrifuge (Reported)
  const issue2 = await Issue.create({
    ticketNumber: 'CF-202610-102',
    title: 'Chemistry Laboratory mixer/centrifuge motor vibrating excessively',
    description: 'Centrifuge unit #3 in the organic chemistry lab makes abnormal noise and smells like burning insulation.',
    category: 'Laboratory',
    building: 'Science Complex',
    floor: '1st Floor',
    room: 'Chem Lab 104',
    priority: 'Critical',
    status: 'Reported',
    reportedBy: studentAlex._id,
    assignedTo: null,
    department: deptFacilities._id,
    votes: [studentAlex._id],
    statusHistory: [
      { status: 'Reported', changedBy: studentAlex._id, changedAt: new Date(now - 1 * dayMs), note: 'Reported urgent safety hazard.' },
    ],
    createdAt: new Date(now - 1 * dayMs),
  });

  // Issue 3: Projector in Lecture Hall (Acknowledged)
  const issue3 = await Issue.create({
    ticketNumber: 'CF-202610-103',
    title: 'Ceiling projector lamp flicker in Lecture Hall 3',
    description: 'During morning classes, the projector screen turns magenta and switches off randomly after 15 minutes of use.',
    category: 'Classrooms',
    building: 'Academic Block A',
    floor: 'Ground Floor',
    room: 'LH-03',
    priority: 'Medium',
    status: 'Acknowledged',
    reportedBy: studentSara._id,
    assignedTo: staffFacilities._id,
    department: deptFacilities._id,
    votes: [studentSara._id, admin._id],
    statusHistory: [
      { status: 'Reported', changedBy: studentSara._id, changedAt: new Date(now - 4 * dayMs), note: 'Student report filed.' },
      { status: 'Acknowledged', changedBy: staffFacilities._id, changedAt: new Date(now - 3 * dayMs), note: 'Spare lamp ordered from warehouse.' },
    ],
    createdAt: new Date(now - 4 * dayMs),
  });

  // Issue 4: Water leakage in Hostel C (Resolved)
  const resolvedDate = new Date(now - 2 * dayMs);
  const issue4 = await Issue.create({
    ticketNumber: 'CF-202610-104',
    title: 'Water pipe dripping in Hostel C 3rd floor washroom',
    description: 'The valve beneath the corner basin is constantly dripping, causing slippery tile floor and puddling.',
    category: 'Cleanliness',
    building: 'Hostel Block C',
    floor: '3rd Floor',
    room: 'Washroom 3B',
    priority: 'Medium',
    status: 'Resolved',
    reportedBy: studentAlex._id,
    assignedTo: staffFacilities._id,
    department: deptFacilities._id,
    votes: [studentAlex._id],
    resolvedAt: resolvedDate,
    statusHistory: [
      { status: 'Reported', changedBy: studentAlex._id, changedAt: new Date(now - 6 * dayMs), note: 'Reported by hostel resident.' },
      { status: 'Acknowledged', changedBy: staffFacilities._id, changedAt: new Date(now - 5 * dayMs), note: 'Assigned to plumbing team.' },
      { status: 'In Progress', changedBy: staffFacilities._id, changedAt: new Date(now - 3 * dayMs), note: 'Replaced Teflon tape and washer valve.' },
      { status: 'Resolved', changedBy: staffFacilities._id, changedAt: resolvedDate, note: 'Valve replaced and tested with full water pressure.' },
    ],
    createdAt: new Date(now - 6 * dayMs),
  });

  // Issue 5: Circuit breaker trip in Engineering Lab (Closed)
  const closedDate = new Date(now - 4 * dayMs);
  const issue5 = await Issue.create({
    ticketNumber: 'CF-202610-105',
    title: 'Main circuit breaker tripping in Robotics Lab',
    description: 'Whenever 3D printers and CNC mill are switched on together, the 32A distribution box trips.',
    category: 'Electricity',
    building: 'Engineering Block',
    floor: 'Basement',
    room: 'Robotics Workshop',
    priority: 'High',
    status: 'Closed',
    reportedBy: studentSara._id,
    assignedTo: staffElectrical._id,
    department: deptElectrical._id,
    votes: [studentSara._id, studentAlex._id, admin._id],
    resolvedAt: new Date(now - 5 * dayMs),
    closedAt: closedDate,
    statusHistory: [
      { status: 'Reported', changedBy: studentSara._id, changedAt: new Date(now - 9 * dayMs), note: 'Reported by robotics team.' },
      { status: 'Acknowledged', changedBy: staffElectrical._id, changedAt: new Date(now - 8 * dayMs), note: 'Electrical inspection scheduled.' },
      { status: 'In Progress', changedBy: staffElectrical._id, changedAt: new Date(now - 7 * dayMs), note: 'Redistributed heavy load to Phase 2 circuit.' },
      { status: 'Resolved', changedBy: staffElectrical._id, changedAt: new Date(now - 5 * dayMs), note: 'New dedicated breaker installed.' },
      { status: 'Closed', changedBy: admin._id, changedAt: closedDate, note: 'Verified by lab supervisor.' },
    ],
    createdAt: new Date(now - 9 * dayMs),
  });

  // Issue 6: Overflowing recycling bins (Reported)
  const issue6 = await Issue.create({
    ticketNumber: 'CF-202610-106',
    title: 'Recycling bins overflowing near Student Cafeteria',
    description: 'Blue and green sorting bins near entrance 2 are full and plastic containers are falling onto the walkway.',
    category: 'Cleanliness',
    building: 'Student Activity Center',
    floor: 'Ground Floor',
    room: 'Cafeteria Courtyard',
    priority: 'Low',
    status: 'Reported',
    reportedBy: studentSara._id,
    assignedTo: null,
    department: deptSanitation._id,
    votes: [studentSara._id],
    statusHistory: [
      { status: 'Reported', changedBy: studentSara._id, changedAt: new Date(now - 12 * 60 * 60 * 1000), note: 'Reported by student.' },
    ],
    createdAt: new Date(now - 12 * 60 * 60 * 1000),
  });

  // Issue 7: Overdue Issue for analytics demo
  const issue7 = await Issue.create({
    ticketNumber: 'CF-202610-107',
    title: 'Broken window latch in Hostel A study room',
    description: 'Window cannot be locked properly, allowing rain and cold drafts into the 2nd floor study area.',
    category: 'Hostels',
    building: 'Hostel Block A',
    floor: '2nd Floor',
    room: 'Study Room 201',
    priority: 'Low',
    status: 'Reported',
    reportedBy: studentAlex._id,
    assignedTo: staffFacilities._id,
    department: deptFacilities._id,
    votes: [],
    statusHistory: [
      { status: 'Reported', changedBy: studentAlex._id, changedAt: new Date(now - 10 * dayMs), note: 'Pending maintenance inspection.' },
    ],
    createdAt: new Date(now - 10 * dayMs),
  });

  console.log('Adding comments...');
  await Comment.create({
    issue: issue1._id,
    author: staffIT._id,
    message: 'Technician dispatched with replacement cat6A and fiber jumper. Estimated time to fix: 2 hours.',
  });

  await Comment.create({
    issue: issue1._id,
    author: studentSara._id,
    message: 'Thank you! Midterm study sessions are ongoing, so quick turnaround is greatly appreciated.',
  });

  console.log('Adding notifications...');
  await Notification.create({
    recipient: studentSara._id,
    issue: issue1._id,
    type: 'status',
    message: `Issue CF-202610-101 changed to "In Progress": Replacing damaged fiber patch cable.`,
    isRead: false,
  });

  await Notification.create({
    recipient: staffFacilities._id,
    issue: issue3._id,
    type: 'assignment',
    message: `You have been assigned to issue CF-202610-103 (Ceiling projector lamp flicker in Lecture Hall 3).`,
    isRead: false,
  });

  console.log('\n========================================');
  console.log('CAMPUSFIX DATABASE SEED COMPLETED!');
  console.log('========================================');
  console.log('Admin Account:   admin@campusfix.dev   / Admin@123');
  console.log('Staff Account:   staff@campusfix.dev   / Staff@123');
  console.log('Staff Account:   electrical@campusfix.dev / Staff@123');
  console.log('Staff Account:   it@campusfix.dev      / Staff@123');
  console.log('Student Account: student@campusfix.dev / Student@123');
  console.log('Student Account: alex@campusfix.dev    / Student@123');
  console.log('Sample Tickets:  CF-202610-101 to CF-202610-107');
  console.log('========================================\n');

  process.exit(0);
};

seedData().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
