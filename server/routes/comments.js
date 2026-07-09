const express = require('express');
const prisma = require('../prismaClient');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get comments for a post with nested replies (public)
router.get('/post/:postId', async (req, res, next) => {
  try {
    const { postId } = req.params;

    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post || post.status !== 'APPROVED') {
      throw Object.assign(new Error('Post not found'), { name: 'ValidationError' });
    }

    const allComments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true } },
        likes: { select: { userId: true } }
      }
    });

    const commentsById = new Map();
    allComments.forEach((comment) => {
      commentsById.set(comment.id, {
        ...comment,
        author: comment.isAnonymous ? null : comment.author,
        replies: []
      });
    });

    const rootComments = [];
    allComments.forEach((comment) => {
      if (comment.parentCommentId) {
        const parent = commentsById.get(comment.parentCommentId);
        if (parent) parent.replies.push(commentsById.get(comment.id));
      } else {
        rootComments.push(commentsById.get(comment.id));
      }
    });

    rootComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ comments: rootComments });
  } catch (error) {
    next(error);
  }
});

// Create comment or reply (authenticated)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { postId, content, parentCommentId } = req.body;

    if (!postId || !content) {
      throw Object.assign(new Error('Post ID and content are required'), { name: 'ValidationError' });
    }

    if (content.length < 1 || content.length > 2000) {
      throw Object.assign(new Error('Comment must be 1-2000 characters'), { name: 'ValidationError' });
    }

    const post = await prisma.post.findUnique({ where: { id: postId } });

    if (!post || post.status !== 'APPROVED') {
      throw Object.assign(new Error('Post not found'), { name: 'ValidationError' });
    }

    if (parentCommentId) {
      const parentComment = await prisma.comment.findUnique({ where: { id: parentCommentId } });
      if (!parentComment || parentComment.postId !== postId) {
        throw Object.assign(new Error('Parent comment not found'), { name: 'ValidationError' });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId,
        authorId: req.user.userId,
        parentCommentId: parentCommentId || null,
        isAnonymous: Boolean(req.body.isAnonymous)
      },
      include: {
        author: { select: { id: true, name: true } }
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

    const existingComment = await prisma.comment.findUnique({ where: { id: commentId } });

    if (!existingComment || existingComment.authorId !== req.user.userId) {
      throw Object.assign(new Error('Comment not found or unauthorized'), { name: 'ValidationError' });
    }

    await prisma.comment.delete({ where: { id: commentId } });

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    next(error);
  }
});

// Get likes count for a comment (public)
router.get('/:id/likes/count', async (req, res, next) => {
  try {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw Object.assign(new Error('Comment not found'), { name: 'ValidationError' });
    }

    const count = await prisma.commentLike.count({ where: { commentId: id } });

    res.json({ count });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
