// Teacher routes - handles teacher schedule and subject management
import express from 'express';
import {
  getSubjects,
  getTutorSubjects,
  addTutorSubject,
  removeTutorSubject,
  getTeacherSchedule,
  addScheduleSlot,
  updateScheduleSlot,
  deleteScheduleSlot,
  getAvailableTimeSlots,
  getTutorsBySubject,
  getAllTeachers,
  getTeacherAppointments,
  getTeacherAvailableDates,
} from '../controllers/teacherController.js';

const router = express.Router();

// Subject routes
router.get('/subjects', getSubjects);
router.get('/subjects/:subjectId/tutors', getTutorsBySubject);

// Get all teachers
router.get('/all', getAllTeachers);

// Tutor subject management
router.get('/tutors/:tutorId/subjects', getTutorSubjects);
router.post('/tutors/:tutorId/subjects', addTutorSubject);
router.delete('/tutors/:tutorId/subjects/:subjectId', removeTutorSubject);

// Teacher schedule management
router.get('/tutors/:tutorId/schedule', getTeacherSchedule);
router.post('/tutors/:tutorId/schedule', addScheduleSlot);
router.put('/tutors/:tutorId/schedule/:scheduleId', updateScheduleSlot);
router.delete('/tutors/:tutorId/schedule/:scheduleId', deleteScheduleSlot);

// Available time slots for booking
router.get('/available-slots', getAvailableTimeSlots);

// Teacher appointments
router.get('/tutors/:tutorId/appointments', getTeacherAppointments);

// Teacher available dates
router.get('/tutors/:tutorId/available-dates', getTeacherAvailableDates);

export default router;
