// models/Project.js
import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  location: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  bidCount: { type: Number, default: 0 },
  totalBudget: Number
});

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);