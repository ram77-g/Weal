const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

const router = express.Router();
const SALT_ROUNDS = 10;

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      throw Object.assign(new Error('Email and password required'), { name: 'ValidationError' });
    }

    if (!validateEmail(email)) {
      throw Object.assign(new Error('Invalid email format'), { name: 'ValidationError' });
    }

    if (password.length < 6) {
      throw Object.assign(new Error('Password must be at least 6 characters'), { name: 'ValidationError' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw Object.assign(new Error('Email and password required'), { name: 'ValidationError' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw Object.assign(new Error('Invalid credentials'), { name: 'ValidationError' });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      throw Object.assign(new Error('Invalid credentials'), { name: 'ValidationError' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
