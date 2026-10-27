const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long.'),
  email: z.string().email('Please provide a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
  role: z.enum(['student', 'staff', 'admin']).optional(),
  department: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters long.'),
});

const createToken = (user) =>
  jwt.sign(
    { userId: user._id.toString(), role: user.role },
    process.env.JWT_SECRET || 'dev-secret',
    { expiresIn: '7d' }
  );

const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const register = async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);

    const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'A user with this email already exists.' });
    }

    const role = payload.role === 'admin' ? 'student' : payload.role || 'student';
    const passwordHash = await bcrypt.hash(payload.password, 10);

    const user = await User.create({
      name: payload.name,
      email: payload.email.toLowerCase(),
      passwordHash,
      role,
      department: payload.department || null,
    });

    const token = createToken(user);
    setAuthCookie(res, token);

    return res.status(201).json({
      message: 'Registration successful.',
      user: { ...user.toJSON(), token },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: error.issues[0]?.message || 'Invalid input.' });
    }
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);

    const user = await User.findOne({ email: payload.email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'This account is inactive.' });
    }

    const token = createToken(user);
    setAuthCookie(res, token);

    return res.json({
      message: 'Login successful.',
      user: { ...user.toJSON(), token },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ message: error.issues[0]?.message || 'Invalid input.' });
    }
    return next(error);
  }
};

const logout = (_req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully.' });
};

const me = async (req, res) => {
  const user = await User.findById(req.user._id).populate('department').select('-passwordHash');
  return res.json({ user });
};

module.exports = { register, login, logout, me };
