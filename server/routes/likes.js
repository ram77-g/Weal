const express = require('express');
const prisma = require('../prismaClient');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ==================== POST LIKES ====================

router.post('/post/:postId', authenticateToken, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post || post.status !== 'APPROVED') {
      throw Object.assign(new Error('Post not found'), { name: 'ValidationError' });
    }

    const existingLike = await prisma.like.findUnique({
      where: { postId_userId: { postId, userId } }
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      res.json({ liked: false, message: 'Like removed' });
    } else {
      await prisma.like.create({ data: { postId, userId } });
      res.json({ liked: true, message: 'Post liked' });
    }
  } catch (error) {
    next(error);
  }
});

router.get('/post/:postId/status', authenticateToken, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const like = await prisma.like.findUnique({
      where: { postId_userId: { postId, userId } }
    });

    res.json({ liked: !!like });
  } catch (error) {
    next(error);
  }
});

router.get('/post/:postId/count', async (req, res, next) => {
  try {
    const { postId } = req.params;
    const count = await prisma.like.count({ where: { postId } });
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// ==================== COMMENT LIKES ====================

router.post('/comment/:commentId', authenticateToken, async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!comment) {
      throw Object.assign(new Error('Comment not found'), { name: 'ValidationError' });
    }

    const existingLike = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId } }
    });

    if (existingLike) {
      await prisma.commentLike.delete({ where: { id: existingLike.id } });
      res.json({ liked: false, message: 'Like removed' });
    } else {
      await prisma.commentLike.create({ data: { commentId, userId } });
      res.json({ liked: true, message: 'Comment liked' });
    }
  } catch (error) {
    next(error);
  }
});

router.get('/comment/:commentId/status', authenticateToken, async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.userId;

    const like = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId } }
    });

    res.json({ liked: !!like });
  } catch (error) {
    next(error);
  }
});

router.get('/comment/:commentId/count', async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const count = await prisma.commentLike.count({ where: { commentId } });
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
