const express = require('express');
const prisma = require('../prismaClient');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');

const router = express.Router();

// All admin routes require auth + admin role
router.use(authenticateToken, requireAdmin);

// Get all users
router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ users });
  } catch (error) { next(error); }
});

// Get all posts (including pending/rejected)
router.get('/posts', async (req, res, next) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, email: true, name: true } },
        _count: { select: { comments: true, likes: true } }
      }
    });
    res.json({ posts });
  } catch (error) { next(error); }
});

// Delete any post
router.delete('/posts/:id', async (req, res, next) => {
  try {
    await prisma.post.delete({ where: { id: req.params.id } });
    res.json({ message: 'Post deleted' });
  } catch (error) { next(error); }
});

// Get all comments
router.get('/comments', async (req, res, next) => {
  try {
    const comments = await prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, email: true, name: true } },
        post: { select: { id: true, title: true } },
        _count: { select: { likes: true } }
      }
    });
    res.json({ comments });
  } catch (error) { next(error); }
});

// Delete any comment
router.delete('/comments/:id', async (req, res, next) => {
  try {
    await prisma.comment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Comment deleted' });
  } catch (error) { next(error); }
});

// Delete any like on a post
router.delete('/likes/:id', async (req, res, next) => {
  try {
    await prisma.like.delete({ where: { id: req.params.id } });
    res.json({ message: 'Like removed' });
  } catch (error) { next(error); }
});

// Delete any comment like
router.delete('/comment-likes/:id', async (req, res, next) => {
  try {
    await prisma.commentLike.delete({ where: { id: req.params.id } });
    res.json({ message: 'Comment like removed' });
  } catch (error) { next(error); }
});

// Promote or demote a user's role (cannot change own role)
router.patch('/users/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    if (req.params.id === req.user.id) {
      return res.status(403).json({ error: 'Cannot change your own role' });
    }
    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, name: true, role: true }
    });
    res.json({ user: updated });
  } catch (error) { next(error); }
});

// Edit any post (Admin only)
router.put('/posts/:id', async (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    if (title.length < 3 || title.length > 200) {
      return res.status(400).json({ error: 'Title must be 3-200 characters' });
    }
    if (content.length < 10 || content.length > 10000) {
      return res.status(400).json({ error: 'Content must be 10-10000 characters' });
    }
    const updated = await prisma.post.update({
      where: { id: req.params.id },
      data: { title: title.trim(), content: content.trim() },
      include: {
        author: { select: { id: true, email: true, name: true } },
        _count: { select: { comments: true, likes: true } }
      }
    });
    res.json({ post: updated });
  } catch (error) { next(error); }
});

// Edit any comment (Admin only)
router.put('/comments/:id', async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    if (content.length < 1 || content.length > 2000) {
      return res.status(400).json({ error: 'Comment must be 1-2000 characters' });
    }
    const updated = await prisma.comment.update({
      where: { id: req.params.id },
      data: { content: content.trim() },
      include: {
        author: { select: { id: true, email: true, name: true } },
        post: { select: { id: true, title: true } },
        _count: { select: { likes: true } }
      }
    });
    res.json({ comment: updated });
  } catch (error) { next(error); }
});

// Delete any user (Admin only, cannot delete self)
router.delete('/users/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted successfully' });
  } catch (error) { next(error); }
});

// Analytics
router.get('/analytics', async (req, res, next) => {
  try {
    // Total counts
    const [totalPosts, totalComments, totalUsers, totalLikes, totalCommentLikes] = await Promise.all([
      prisma.post.count(),
      prisma.comment.count(),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.like.count(),
      prisma.commentLike.count()
    ]);

    // Top 5 most liked posts
    const topPosts = await prisma.post.findMany({
      orderBy: { likes: { _count: 'desc' } },
      take: 5,
      include: {
        author: { select: { name: true } },
        _count: { select: { likes: true, comments: true } }
      }
    });

    // Top 5 most liked comments
    const topComments = await prisma.comment.findMany({
      orderBy: { likes: { _count: 'desc' } },
      take: 5,
      include: {
        author: { select: { name: true } },
        post: { select: { title: true } },
        _count: { select: { likes: true } }
      }
    });

    // Most active users (by post + comment count)
    const activeUsers = await prisma.user.findMany({
      where: { role: 'USER' },
      include: {
        _count: { select: { posts: true, comments: true } }
      },
      orderBy: { posts: { _count: 'desc' } },
      take: 5
    });

    // Posts per day for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentPosts = await prisma.post.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true }
    });

    // Build day-by-day counts
    const dayMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      dayMap[key] = 0;
    }
    recentPosts.forEach(p => {
      const key = new Date(p.createdAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      if (dayMap[key] !== undefined) dayMap[key]++;
    });

    const postsPerDay = Object.entries(dayMap).map(([day, count]) => ({ day, count }));

    res.json({
      totals: { posts: totalPosts, comments: totalComments, users: totalUsers, likes: totalLikes + totalCommentLikes },
      topPosts: topPosts.map(p => ({
        id: p.id, title: p.title,
        author: p.isAnonymous ? 'Anonymous' : (p.author?.name || 'Unknown'),
        likes: p._count.likes, comments: p._count.comments
      })),
      topComments: topComments.map(c => ({
        id: c.id, content: c.content.slice(0, 80),
        author: c.isAnonymous ? 'Anonymous' : (c.author?.name || 'Unknown'),
        postTitle: c.post?.title, likes: c._count.likes
      })),
      activeUsers: activeUsers.map(u => ({
        id: u.id, name: u.name || u.email,
        posts: u._count.posts, comments: u._count.comments,
        total: u._count.posts + u._count.comments
      })),
      postsPerDay
    });
  } catch (error) { next(error); }
});

module.exports = router;
