const express = require('express');
const prisma = require('../prismaClient');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get comments for a post (public)
router.get('/post/:postId', async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post || post.status !== 'APPROVED') {
      throw Object.assign(new Error('Post not found'), { name: 'ValidationError' });
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: { id: true, name: true }
        }
      }
    });

    res.json({ comments });
  } catch (error) {
    next(error);
  }
});

// Create comment (authenticated)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { postId, content } = req.body;

    if (!postId || !content) {
      throw Object.assign(new Error('Post ID and content are required'), { name: 'ValidationError' });
    }

    if (content.length < 1 || content.length > 2000) {
      throw Object.assign(new Error('Comment must be 1-2000 characters'), { name: 'ValidationError' });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post || post.status !== 'APPROVED') {
      throw Object.assign(new Error('Post not found'), { name: 'ValidationError' });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId,
        authorId: req.user.userId
      },
      include: {
        author: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
});

// Delete user's own comment (authenticated)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const commentId = req.params.id;

    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!existingComment || existingComment.authorId !== req.user.userId) {
      throw Object.assign(new Error('Comment not found or unauthorized'), { name: 'ValidationError' });
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
