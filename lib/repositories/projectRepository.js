// lib/repositories/projectRepository.js
import dbConnect from '@/lib/mongodb';
import Project from '@/models/Project';

export async function getAllProjects() {
  await dbConnect();
  return Project.find({}).sort({ createdAt: -1 });
}

export async function getProjectById(id) {
  await dbConnect();
  return Project.findById(id);
}

export async function createProject(data) {
  await dbConnect();
  const project = new Project(data);
  return project.save();
}

// More functions...