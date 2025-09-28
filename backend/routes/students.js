import express from 'express';
import {
  getStudents,
  getStudentById,
} from '../controllers/studentController.js';

const router = express.Router();

// GET /api/v1/students - Get all students
router.get('/', getStudents);

// GET /api/v1/students/:id - Get a specific student by ID
router.get('/:id', getStudentById);

export default router;
