const express = require('express');
const prisma = require('../prismaClient');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Toggle like on a post (authenticated)
router.post('/:postId', authenticateToken, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post || post.status !== 'APPROVED') {
      throw Object.assign(new Error('Post not found'), { name: 'ValidationError' });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { id: existingLike.id }
      });
      res.json({ liked: false, message: 'Like removed' });
    } else {
      await prisma.like.create({
        data: {
          postId,
          userId
        }
      });
      res.json({ liked: true, message: 'Post liked' });
    }
  } catch (error) {
    next(error);
  }
});

// Check if user liked a post (authenticated)
router.get('/:postId/status', authenticateToken, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const like = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId
        }
      }
    });

    res.json({ liked: !!like });
  } catch (error) {
    next(error);
  }
});

// Get total likes for a post (public)
router.get('/:postId/count', async (req, res, next) => {
  try {
    const { postId } = req.params;

    const count = await prisma.like.count({
      where: { postId }
    });

    res.json({ count });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
