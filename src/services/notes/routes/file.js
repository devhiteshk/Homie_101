const express = require('express');

module.exports = (FileModel, ProjectModel, protect) => {
  const router = express.Router();

  // POST /api/notes/files
  router.post('/files', protect, async (req, res) => {
    try {
      const project = await ProjectModel.findById(req.body.projectId);
      if (!project) return res.status(404).json({ message: 'Project not found' });
      if (project.user.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

      const file = await FileModel.create({ name: req.body.name, project: req.body.projectId });
      res.status(201).json(file);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // GET /api/notes/files/by-project/:projectId
  router.get('/files/by-project/:projectId', protect, async (req, res) => {
    try {
      const files = await FileModel.find({ project: req.params.projectId }).populate('project');
      res.json(files);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // GET /api/notes/files/:id
  router.get('/files/:id', protect, async (req, res) => {
    try {
      const file = await FileModel.findById(req.params.id).populate('project');
      if (!file) return res.status(404).json({ message: 'File not found' });
      if (file.project.user.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
      res.json(file);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // PUT /api/notes/files/:id
  router.put('/files/:id', protect, async (req, res) => {
    try {
      const file = await FileModel.findById(req.params.id).populate('project');
      if (!file) return res.status(404).json({ message: 'File not found' });
      if (file.project.user.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

      const updated = await FileModel.findByIdAndUpdate(
        req.params.id,
        { name: req.body.name, content: req.body.content },
        { new: true }
      );
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // DELETE /api/notes/files/:id
  router.delete('/files/:id', protect, async (req, res) => {
    try {
      const result = await FileModel.deleteMany({ _id: req.params.id });
      res.json({ message: `${result.deletedCount} file(s) deleted` });
    } catch (err) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  return router;
};
