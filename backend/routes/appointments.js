import express from 'express';
import { body, param, query } from 'express-validator';
import {
  getAppointments,
  getAvailableSlots,
  bookAppointment,
  updateAppointment,
  cancelAppointment,
  cleanupAppointments,
} from '../controllers/appointmentController.js';

const router = express.Router();

// Validation rules
const bookAppointmentValidation = [
  body('dateTime')
    .isISO8601()
    .toDate()
    .withMessage('Valid dateTime is required'),
  body('tutorId').isInt({ min: 1 }).withMessage('Valid tutorId is required'),
  body('studentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid studentId is required'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be a string with maximum 500 characters'),
];

const updateAppointmentValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid appointment ID is required'),
  body('dateTime')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid dateTime is required'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be a string with maximum 500 characters'),
];

const appointmentIdValidation = [
  param('id').isInt({ min: 1 }).withMessage('Valid appointment ID is required'),
];

const availableSlotsValidation = [
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Valid date is required (YYYY-MM-DD format)'),
];

// Routes
router.get('/', getAppointments);
router.get('/available-slots', availableSlotsValidation, getAvailableSlots);
router.post('/', bookAppointmentValidation, bookAppointment);
router.put('/:id', updateAppointmentValidation, updateAppointment);
router.delete('/:id', appointmentIdValidation, cancelAppointment);
router.post('/cleanup', cleanupAppointments); // Temporary cleanup route

export default router;
