import express from 'express';
import cors from 'cors';
import sql from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

// Test the subjects endpoint
app.get('/api/v1/teachers/subjects', async (req, res) => {
  try {
    console.log('📚 Getting subjects...');
    const subjects = await sql`
      SELECT * FROM subjects 
      WHERE is_active = true 
      ORDER BY name ASC
    `;

    console.log(`✅ Found ${subjects.length} subjects`);
    res.json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    console.error('❌ Error fetching subjects:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects',
    });
  }
});

// Test tutors by subject endpoint
app.get('/api/v1/teachers/subjects/:subjectId/tutors', async (req, res) => {
  try {
    const { subjectId } = req.params;
    console.log(`👨‍🏫 Getting tutors for subject ${subjectId}...`);

    const tutors = await sql`
      SELECT 
        t.id,
        u.name,
        u.email,
        t.experience_years,
        t.bio,
        COALESCE(ts.hourly_rate, t.hourly_rate) as hourly_rate,
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

    console.log(`✅ Found ${tutors.length} tutors for subject ${subjectId}`);
    res.json({
      success: true,
      data: tutors,
    });
  } catch (error) {
    console.error('❌ Error fetching tutors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tutors',
    });
  }
});

// Test available slots endpoint
app.get('/api/v1/teachers/available-slots', async (req, res) => {
  try {
    const { tutorId, subjectId, date } = req.query;
    console.log(
      `📅 Getting slots for tutor ${tutorId}, subject ${subjectId}, date ${date}...`
    );

    if (!tutorId || !subjectId || !date) {
      return res.status(400).json({
        success: false,
        message: 'tutorId, subjectId, and date are required',
      });
    }

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();

    console.log(`📅 Day of week: ${dayOfWeek}`);

    // Get schedules for this day
    const schedules = await sql`
      SELECT start_time, end_time
      FROM teacher_schedules 
      WHERE tutor_id = ${tutorId} 
        AND subject_id = ${subjectId}
        AND day_of_week = ${dayOfWeek}
        AND is_active = true
      ORDER BY start_time ASC
    `;

    console.log(`📋 Found ${schedules.length} schedule blocks`);

    // Get existing appointments
    const appointments = await sql`
      SELECT start_time, end_time
      FROM appointments 
      WHERE tutor_id = ${tutorId} 
        AND subject_id = ${subjectId}
        AND appointment_date = ${date}
        AND status IN ('scheduled', 'rescheduled')
    `;

    console.log(`📋 Found ${appointments.length} existing appointments`);

    // Generate available slots
    const availableSlots = [];

    for (const schedule of schedules) {
      const startHour = parseInt(schedule.start_time.split(':')[0]);
      const endHour = parseInt(schedule.end_time.split(':')[0]);

      for (let hour = startHour; hour < endHour; hour++) {
        const slotStart = `${hour.toString().padStart(2, '0')}:00:00`;
        const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00:00`;

        // Check if slot is booked
        const isBooked = appointments.some(
          (apt) => apt.start_time === slotStart
        );

        if (!isBooked) {
          availableSlots.push({
            id: `${tutorId}-${subjectId}-${date}-${hour}`,
            dateTime: `${date}T${slotStart}`,
            startTime: slotStart,
            endTime: slotEnd,
            tutorId: parseInt(tutorId),
            subjectId: parseInt(subjectId),
            isBooked: false,
          });
        }
      }
    }

    console.log(`✅ Generated ${availableSlots.length} available slots`);
    res.json({
      success: true,
      data: availableSlots,
    });
  } catch (error) {
    console.error('❌ Error fetching available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available time slots',
    });
  }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🧪 Test API server running on port ${PORT}`);
  console.log(
    `📚 Test subjects: http://localhost:${PORT}/api/v1/teachers/subjects`
  );
  console.log(
    `👨‍🏫 Test tutors: http://localhost:${PORT}/api/v1/teachers/subjects/1/tutors`
  );
  console.log(
    `📅 Test slots: http://localhost:${PORT}/api/v1/teachers/available-slots?tutorId=1&subjectId=1&date=2025-10-07`
  );
});
