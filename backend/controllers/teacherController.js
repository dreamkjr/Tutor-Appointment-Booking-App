// Teacher schedule controller - handles teacher availability and schedule management
import sql from '../db.js';

// Get all subjects
export const getSubjects = async (req, res) => {
  try {
    const subjects = await sql`
      SELECT * FROM subjects 
      WHERE is_active = true 
      ORDER BY name ASC
    `;

    res.json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects',
    });
  }
};

// Get tutor's subjects
export const getTutorSubjects = async (req, res) => {
  try {
    const { tutorId } = req.params;

    const tutorSubjects = await sql`
      SELECT 
        ts.id,
        ts.tutor_id as "tutorId",
        ts.subject_id as "subjectId",
        ts.is_active as "isActive",
        s.name as "subjectName",
        s.description as "subjectDescription"
      FROM tutor_subjects ts
      JOIN subjects s ON ts.subject_id = s.id
      WHERE ts.tutor_id = ${tutorId} AND ts.is_active = true AND s.is_active = true
      ORDER BY s.name ASC
    `;

    res.json({
      success: true,
      data: tutorSubjects,
    });
  } catch (error) {
    console.error('Error fetching tutor subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tutor subjects',
    });
  }
};

// Add subject to tutor
export const addTutorSubject = async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { subjectId } = req.body;

    // Use UPSERT to handle existing relationships
    const result = await sql`
      INSERT INTO tutor_subjects (tutor_id, subject_id, is_active)
      VALUES (${tutorId}, ${subjectId}, true)
      ON CONFLICT (tutor_id, subject_id) 
      DO UPDATE SET 
        is_active = true
      RETURNING *
    `;

    res.json({
      success: true,
      data: result[0],
      message: 'Subject added successfully',
    });
  } catch (error) {
    console.error('Error adding tutor subject:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add subject',
    });
  }
};

// Remove subject from tutor
export const removeTutorSubject = async (req, res) => {
  try {
    const { tutorId, subjectId } = req.params;

    await sql`
      UPDATE tutor_subjects 
      SET is_active = false 
      WHERE tutor_id = ${tutorId} AND subject_id = ${subjectId}
    `;

    res.json({
      success: true,
      message: 'Subject removed successfully',
    });
  } catch (error) {
    console.error('Error removing tutor subject:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove subject',
    });
  }
};

// Get teacher's schedule
export const getTeacherSchedule = async (req, res) => {
  try {
    const { tutorId } = req.params;

    const schedule = await sql`
      SELECT 
        ts.id,
        ts.tutor_id as "tutorId",
        ts.subject_id as "subjectId",
        ts.day_of_week as "dayOfWeek",
        ts.start_time as "startTime",
        ts.end_time as "endTime",
        ts.is_active as "isActive",
        s.name as "subjectName",
        s.description as "subjectDescription"
      FROM teacher_schedules ts
      JOIN subjects s ON ts.subject_id = s.id
      WHERE ts.tutor_id = ${tutorId} AND ts.is_active = true
      ORDER BY ts.day_of_week ASC, ts.start_time ASC
    `;

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('Error fetching teacher schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teacher schedule',
    });
  }
};

// Add schedule slot
export const addScheduleSlot = async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { subjectId, dayOfWeek, startTime, endTime } = req.body;

    // Validate time range
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be before end time',
      });
    }

    // Check for overlapping slots
    const overlapping = await sql`
      SELECT id FROM teacher_schedules 
      WHERE tutor_id = ${tutorId} 
        AND subject_id = ${subjectId}
        AND day_of_week = ${dayOfWeek}
        AND is_active = true
        AND (
          (start_time <= ${startTime} AND end_time > ${startTime})
          OR (start_time < ${endTime} AND end_time >= ${endTime})
          OR (start_time >= ${startTime} AND end_time <= ${endTime})
        )
    `;

    if (overlapping.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Schedule slot overlaps with existing slot',
      });
    }

    const result = await sql`
      INSERT INTO teacher_schedules (tutor_id, subject_id, day_of_week, start_time, end_time)
      VALUES (${tutorId}, ${subjectId}, ${dayOfWeek}, ${startTime}, ${endTime})
      RETURNING *
    `;

    res.json({
      success: true,
      data: result[0],
      message: 'Schedule slot added successfully',
    });
  } catch (error) {
    console.error('Error adding schedule slot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add schedule slot',
    });
  }
};

// Update schedule slot
export const updateScheduleSlot = async (req, res) => {
  try {
    const { tutorId, scheduleId } = req.params;
    const { subjectId, dayOfWeek, startTime, endTime } = req.body;

    // Validate time range
    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: 'Start time must be before end time',
      });
    }

    // Check for overlapping slots (excluding current slot)
    const overlapping = await sql`
      SELECT id FROM teacher_schedules 
      WHERE tutor_id = ${tutorId} 
        AND subject_id = ${subjectId}
        AND day_of_week = ${dayOfWeek}
        AND id != ${scheduleId}
        AND is_active = true
        AND (
          (start_time <= ${startTime} AND end_time > ${startTime})
          OR (start_time < ${endTime} AND end_time >= ${endTime})
          OR (start_time >= ${startTime} AND end_time <= ${endTime})
        )
    `;

    if (overlapping.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Schedule slot overlaps with existing slot',
      });
    }

    const result = await sql`
      UPDATE teacher_schedules 
      SET subject_id = ${subjectId}, day_of_week = ${dayOfWeek}, 
          start_time = ${startTime}, end_time = ${endTime}
      WHERE id = ${scheduleId} AND tutor_id = ${tutorId}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Schedule slot not found',
      });
    }

    res.json({
      success: true,
      data: result[0],
      message: 'Schedule slot updated successfully',
    });
  } catch (error) {
    console.error('Error updating schedule slot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update schedule slot',
    });
  }
};

// Delete schedule slot
export const deleteScheduleSlot = async (req, res) => {
  try {
    const { tutorId, scheduleId } = req.params;

    await sql`
      UPDATE teacher_schedules 
      SET is_active = false 
      WHERE id = ${scheduleId} AND tutor_id = ${tutorId}
    `;

    res.json({
      success: true,
      message: 'Schedule slot deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting schedule slot:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete schedule slot',
    });
  }
};

// Get available time slots for student booking
export const getAvailableTimeSlots = async (req, res) => {
  try {
    const { tutorId, subjectId, date } = req.query;

    if (!tutorId || !subjectId || !date) {
      return res.status(400).json({
        success: false,
        message: 'tutorId, subjectId, and date are required',
      });
    }

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay(); // 0=Sunday, 6=Saturday

    // Get teacher's schedule for this day and subject
    const schedules = await sql`
      SELECT start_time, end_time
      FROM teacher_schedules 
      WHERE tutor_id = ${tutorId} 
        AND subject_id = ${subjectId}
        AND day_of_week = ${dayOfWeek}
        AND is_active = true
      ORDER BY start_time ASC
    `;

    // If no schedules found, return empty array
    if (schedules.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Get existing appointments for this date, tutor, and subject
    const appointments = await sql`
      SELECT start_time, end_time
      FROM appointments 
      WHERE tutor_id = ${tutorId} 
        AND subject_id = ${subjectId}
        AND appointment_date = ${date}
        AND status IN ('scheduled', 'rescheduled')
    `;

    // Generate available time slots (1-hour slots)
    const availableSlots = [];

    for (const schedule of schedules) {
      // Extract time values from postgres result (postgres.js converts to camelCase)
      const scheduleStartTime = schedule.startTime;
      const scheduleEndTime = schedule.endTime;

      // Skip if startTime or endTime is undefined
      if (!scheduleStartTime || !scheduleEndTime) {
        continue;
      }

      const startHour = parseInt(scheduleStartTime.split(':')[0]);
      const endHour = parseInt(scheduleEndTime.split(':')[0]);

      for (let hour = startHour; hour < endHour; hour++) {
        const slotStart = `${hour.toString().padStart(2, '0')}:00:00`;
        const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00:00`;

        // Check if this slot is already booked (postgres.js converts to camelCase)
        const isBooked = appointments.some(
          (apt) => apt.startTime === slotStart
        );

        // Add all slots (both available and booked) with correct status
        availableSlots.push({
          id: `${tutorId}-${subjectId}-${date}-${hour}`,
          dateTime: `${date}T${slotStart}`,
          startTime: slotStart,
          endTime: slotEnd,
          tutorId: parseInt(tutorId),
          subjectId: parseInt(subjectId),
          isBooked: isBooked,
        });
      }
    }

    res.json({
      success: true,
      data: availableSlots,
    });
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available time slots',
    });
  }
};

// Get tutors by subject
export const getTutorsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const tutors = await sql`
      SELECT 
        t.id,
        u.name,
        u.email,
        t.experience_years,
        t.bio,
        s.name as subject_name
      FROM tutors t
      JOIN users u ON t.user_id = u.id
      JOIN tutor_subjects ts ON t.id = ts.tutor_id
      JOIN subjects s ON ts.subject_id = s.id
      WHERE ts.subject_id = ${subjectId}
        AND ts.is_active = true
        AND t.is_active = true
        AND u.role = 'tutor'
      ORDER BY u.name ASC
    `;
    res.json({
      success: true,
      data: tutors,
    });
  } catch (error) {
    console.error('Error fetching tutors by subject:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tutors',
    });
  }
};

// Get all teachers for booking selection
export const getAllTeachers = async (req, res) => {
  try {
    const teachers = await sql`
      SELECT 
        t.id,
        u.name,
        u.email,
        t.experience_years,
        t.bio
      FROM tutors t
      JOIN users u ON t.user_id = u.id
      WHERE t.is_active = true
        AND u.role = 'tutor'
      ORDER BY u.name ASC
    `;

    res.json({
      success: true,
      data: teachers,
    });
  } catch (error) {
    console.error('Error fetching all teachers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teachers',
    });
  }
};

// Get teacher's appointments
export const getTeacherAppointments = async (req, res) => {
  try {
    const { tutorId } = req.params;

    const appointments = await sql`
      SELECT 
        a.id,
        a.student_id as "studentId",
        a.tutor_id as "tutorId",
        a.appointment_date as "appointmentDate",
        a.start_time as "startTime",
        a.end_time as "endTime",
        a.status,
        a.notes,
        a.created_at as "createdAt",
        s.name as "subjectName",
        u.name as "studentName",
        u.email as "studentEmail"
      FROM appointments a
      JOIN users u ON a.student_id = u.id
      JOIN subjects s ON a.subject_id = s.id
      WHERE a.tutor_id = ${tutorId}
        AND a.status != 'cancelled'
        AND a.appointment_date >= CURRENT_DATE
      ORDER BY a.appointment_date ASC, a.start_time ASC
    `;

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error('Error fetching teacher appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
    });
  }
};

// Get available dates for a teacher (dates where they have schedules)
export const getTeacherAvailableDates = async (req, res) => {
  try {
    const { tutorId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required',
      });
    }

    // Get all days of the week that the teacher has schedules for
    const schedules = await sql`
      SELECT DISTINCT day_of_week
      FROM teacher_schedules 
      WHERE tutor_id = ${tutorId} 
        AND is_active = true
      ORDER BY day_of_week
    `;

    console.log(`🗓️ Teacher ${tutorId} schedules:`, schedules);

    // Convert day numbers to actual dates within the range
    const availableDates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get array of available days (0 = Sunday, 1 = Monday, etc.)
    const availableDays = schedules.map((s) =>
      s.dayOfWeek !== undefined ? s.dayOfWeek : s.day_of_week
    );
    console.log(`📅 Available days for teacher ${tutorId}:`, availableDays);

    for (
      let date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      const dayOfWeek = date.getDay();
      if (availableDays.includes(dayOfWeek)) {
        availableDates.push(new Date(date).toISOString().split('T')[0]);
      }
    }

    res.json({
      success: true,
      data: availableDates,
    });
  } catch (error) {
    console.error('Error fetching teacher available dates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available dates',
    });
  }
};
