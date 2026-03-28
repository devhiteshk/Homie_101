const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const registerModels = (conn) => {
  // User
  const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
  });

  UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });

  UserSchema.methods.matchPassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
  };

  // Project
  const ProjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  });

  // File
  const FileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    content: { type: String },
  });

  return {
    User: conn.model('User', UserSchema),
    Project: conn.model('Project', ProjectSchema),
    File: conn.model('File', FileSchema),
  };
};

module.exports = registerModels;
