const express = require('express');
const prisma = require('../prismaClient');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function validatePost(title, content) {
  if (!title || !content) {
    throw Object.assign(new Error('Title and content are required'), { name: 'ValidationError' });
  }
  if (title.length < 3 || title.length > 200) {
    throw Object.assign(new Error('Title must be 3-200 characters'), { name: 'ValidationError' });
  }
  if (content.length < 10 || content.length > 10000) {
    throw Object.assign(new Error('Content must be 10-10000 characters'), { name: 'ValidationError' });
  }
}

// Get all approved posts (public)
router.get('/', async (req, res, next) => {
  try {
    const posts = await prisma.post.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { comments: true, likes: true }
        },
        author: {
          select: { id: true, name: true }
        }
      }
    });

    const sanitizedPosts = posts.map(post => ({
      ...post,
      author: post.isAnonymous ? null : post.author
    }));

    res.json({ posts: sanitizedPosts });
  } catch (error) {
    next(error);
  }
});

// Get single post by ID (public)
router.get('/:id', async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: { id: true, name: true }
        },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, name: true }
            }
          }
        },
        _count: {
          select: { likes: true }
        }
      }
    });

    if (!post || post.status !== 'APPROVED') {
      throw Object.assign(new Error('Post not found'), { name: 'ValidationError' });
    }

    res.json({
      post: {
        ...post,
        author: post.isAnonymous ? null : post.author
      }
    });
  } catch (error) {
    next(error);
  }
});

// Create post (authenticated)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { title, content, isAnonymous } = req.body;

    validatePost(title, content);

    const post = await prisma.post.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        isAnonymous: isAnonymous || false,
        authorId: req.user.userId
      },
      include: {
        author: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json({
      post: {
        ...post,
        author: post.isAnonymous ? null : post.author
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user's own post (authenticated)
router.put('/:id', authenticateToken, async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const postId = req.params.id;

    validatePost(title, content);

    const existingPost = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!existingPost || existingPost.authorId !== req.user.userId) {
      throw Object.assign(new Error('Post not found or unauthorized'), { name: 'ValidationError' });
    }

    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        title: title.trim(),
        content: content.trim()
      },
      include: {
        author: {
          select: { id: true, name: true }
        }
      }
    });

    res.json({
      post: {
        ...post,
        author: post.isAnonymous ? null : post.author
      }
    });
  } catch (error) {
    next(error);
  }
});

// Delete user's own post (authenticated)
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const postId = req.params.id;

    const existingPost = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!existingPost || existingPost.authorId !== req.user.userId) {
      throw Object.assign(new Error('Post not found or unauthorized'), { name: 'ValidationError' });
    }

    await prisma.post.delete({
      where: { id: postId }
    });

    res.json({ message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
});

// Get current user's posts (authenticated)
router.get('/user/my-posts', authenticateToken, async (req, res, next) => {
  try {
    const posts = await prisma.post.findMany({
      where: { authorId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { comments: true, likes: true }
        }
      }
    });

    res.json({ posts });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
