const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const nodemailer = require('nodemailer');
const prisma = require('../prismaClient');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'weal-dev-jwt-secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'weal-dev-refresh-secret';

let transporter;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  console.log('Using real SMTP server for emails.');
} else {
  nodemailer.createTestAccount().then((account) => {
    transporter = nodemailer.createTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      auth: { user: account.user, pass: account.pass },
    });
    console.log('Using Ethereal fake SMTP server for emails.');
  });
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function generateTokens(user) {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { userId: user.id },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
}

router.post('/send-otp', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !validateEmail(email)) return res.status(400).json({ error: 'Valid email required' });
    
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) return res.status(400).json({ error: 'Email already in use' });

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otp.deleteMany({ where: { email: email.toLowerCase() } });
    await prisma.otp.create({ data: { email: email.toLowerCase(), code, expiresAt } });

    if (transporter) {
      const info = await transporter.sendMail({
        from: '"WEAL Accounts" <noreply@weal.com>',
        to: email,
        subject: 'Your WEAL Verification Code',
        text: `Your verification code is: ${code}. It expires in 10 minutes.`
      });
      console.log('OTP Email sent! Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) { next(error); }
});

router.post('/forgot-password-otp', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !validateEmail(email)) return res.status(400).json({ error: 'Valid email required' });
    
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!existingUser) return res.status(404).json({ error: 'No account found with this email' });

    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otp.deleteMany({ where: { email: email.toLowerCase() } });
    await prisma.otp.create({ data: { email: email.toLowerCase(), code, expiresAt } });

    if (transporter) {
      const info = await transporter.sendMail({
        from: '"WEAL Accounts" <noreply@weal.com>',
        to: email,
        subject: 'WEAL Password Reset Code',
        text: `Your password reset code is: ${code}. It expires in 10 minutes.`
      });
      console.log('Password Reset OTP Email sent! Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    res.json({ message: 'Password reset OTP sent successfully' });
  } catch (error) { next(error); }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) return res.status(400).json({ error: 'Email, OTP, and new password required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!existingUser) return res.status(404).json({ error: 'User not found' });

    const otpRecord = await prisma.otp.findFirst({ where: { email: email.toLowerCase(), code: otp } });
    if (!otpRecord) return res.status(400).json({ error: 'Invalid OTP' });
    if (otpRecord.expiresAt < new Date()) return res.status(400).json({ error: 'OTP has expired' });

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { password: hashedPassword }
    });

    await prisma.otp.deleteMany({ where: { email: email.toLowerCase() } });

    res.json({ message: 'Password reset successfully' });
  } catch (error) { next(error); }
});

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, name, otp } = req.body;
    if (!email || !password || !otp) throw Object.assign(new Error('Email, password, and OTP required'), { name: 'ValidationError' });
    if (!validateEmail(email)) throw Object.assign(new Error('Invalid email format'), { name: 'ValidationError' });
    if (password.length < 6) throw Object.assign(new Error('Password must be at least 6 characters'), { name: 'ValidationError' });

    const otpRecord = await prisma.otp.findFirst({ where: { email: email.toLowerCase(), code: otp } });
    if (!otpRecord) throw Object.assign(new Error('Invalid OTP'), { name: 'ValidationError' });
    if (otpRecord.expiresAt < new Date()) throw Object.assign(new Error('OTP has expired'), { name: 'ValidationError' });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), password: hashedPassword, name },
      select: { id: true, email: true, name: true, phoneNumber: true, dateOfBirth: true, profilePicture: true, role: true, authProvider: true, createdAt: true, password: true }
    });

    await prisma.otp.deleteMany({ where: { email: email.toLowerCase() } });

    const { accessToken, refreshToken } = generateTokens(user);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res.status(201).json({ user: { ...user, hasPassword: !!user.password }, token: accessToken, refreshToken });
  } catch (error) { next(error); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw Object.assign(new Error('Email and password required'), { name: 'ValidationError' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) throw Object.assign(new Error('Invalid credentials'), { name: 'ValidationError' });

    if (!user.password) {
      throw Object.assign(new Error('This account uses Google Sign-In. Please use the "Sign in with Google" button.'), { name: 'ValidationError' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) throw Object.assign(new Error('Invalid credentials'), { name: 'ValidationError' });

    const { accessToken, refreshToken } = generateTokens(user);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, phoneNumber: user.phoneNumber, dateOfBirth: user.dateOfBirth, profilePicture: user.profilePicture, role: user.role, authProvider: user.authProvider, hasPassword: !!user.password },
      token: accessToken,
      refreshToken
    });
  } catch (error) { next(error); }
});

router.post('/google', async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) throw Object.assign(new Error('Google token required'), { name: 'ValidationError' });

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    
    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId, profilePicture: user.profilePicture || picture, authProvider: 'GOOGLE' }
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          googleId,
          authProvider: 'GOOGLE',
          name,
          profilePicture: picture
        }
      });
    }

    const { accessToken, refreshToken } = generateTokens(user);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, phoneNumber: user.phoneNumber, dateOfBirth: user.dateOfBirth, profilePicture: user.profilePicture, role: user.role, authProvider: user.authProvider, hasPassword: !!user.password },
      token: accessToken,
      refreshToken
    });
  } catch (error) { next(error); }
});


router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

    let payload;
    try {
      payload = jwt.verify(refreshToken, REFRESH_SECRET);
    } catch {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: 'Refresh token revoked' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ token: accessToken, refreshToken });
  } catch (error) { next(error); }
});

router.post('/logout', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const payload = jwt.decode(refreshToken);
      if (payload?.userId) {
        await prisma.user.update({ where: { id: payload.userId }, data: { refreshToken: null } }).catch(() => {});
      }
    }
    res.json({ message: 'Logged out' });
  } catch (error) { next(error); }
});
router.post('/set-password', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    
    const token = authHeader.split(' ')[1];
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: { password: hashedPassword }
    });

    res.json({ 
      message: 'Password set successfully', 
      user: { id: user.id, email: user.email, name: user.name, phoneNumber: user.phoneNumber, dateOfBirth: user.dateOfBirth, profilePicture: user.profilePicture, role: user.role, authProvider: user.authProvider, hasPassword: true } 
    });
  } catch (error) { next(error); }
});

module.exports = router;
