const express = require('express');

module.exports = (ProjectModel, FileModel, protect) => {
  const router = express.Router();

  // POST /api/notes/projects
  router.post('/projects', protect, async (req, res) => {
    try {
      const project = await ProjectModel.create({ name: req.body.name, user: req.user.id });
      res.status(201).json(project);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // GET /api/notes/projects
  router.get('/projects', protect, async (req, res) => {
    try {
      const projects = await ProjectModel.find({ user: req.user.id });
      res.json(projects);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // DELETE /api/notes/projects/:id
  router.delete('/projects/:id', protect, async (req, res) => {
    try {
      const result = await ProjectModel.deleteMany({ _id: req.params.id });
      res.json({ message: `${result.deletedCount} project(s) deleted` });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
};
