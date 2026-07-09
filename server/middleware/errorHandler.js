function errorHandler(err, req, res, next) {
  console.error('ERROR HANDLER:', err);

  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Email already exists' });
    }
    return res.status(400).json({ error: `Database error: ${err.message}` });
  }

  if (err.name === 'PrismaClientValidationError') {
    return res.status(400).json({ error: `Database error: ${err.message}` });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: `Internal server error: ${err.message}` });
}

module.exports = { errorHandler };
