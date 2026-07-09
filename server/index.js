require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const bcrypt = require('bcrypt');
const prisma = require('./prismaClient');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const commentRoutes = require('./routes/comments');
const likeRoutes = require('./routes/likes');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const { authenticateToken } = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET not set; using default development secret.');
}
const JWT_SECRET = process.env.JWT_SECRET || 'weal-dev-jwt-secret';
app.locals.JWT_SECRET = JWT_SECRET;

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/auth', authRoutes);
app.use('/posts', postRoutes);
app.use('/comments', commentRoutes);
app.use('/likes', likeRoutes);
app.use('/admin', adminRoutes);
app.use('/upload', uploadRoutes);

app.get('/users', authenticateToken, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, createdAt: true }
    });
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

app.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true, name: true, phoneNumber: true, dateOfBirth: true, profilePicture: true, role: true, createdAt: true }
    });
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

app.patch('/me', authenticateToken, async (req, res, next) => {
  try {
    const { name, currentPassword, newPassword, phoneNumber, dateOfBirth, profilePicture } = req.body;
    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) throw Object.assign(new Error('Name cannot be empty'), { name: 'ValidationError' });
      updateData.name = name.trim();
    }

    if (newPassword) {
      if (newPassword.length < 6) throw Object.assign(new Error('Password must be at least 6 characters'), { name: 'ValidationError' });
      if (!currentPassword) throw Object.assign(new Error('Current password required'), { name: 'ValidationError' });
      const existing = await prisma.user.findUnique({ where: { id: req.user.userId } });
      const valid = await bcrypt.compare(currentPassword, existing.password);
      if (!valid) throw Object.assign(new Error('Current password is incorrect'), { name: 'ValidationError' });
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
      select: { id: true, email: true, name: true, phoneNumber: true, dateOfBirth: true, profilePicture: true, role: true, createdAt: true }
    });
    res.json({ user: updated });
  } catch (error) {
    next(error);
  }
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
