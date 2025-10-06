import sql from './db.js';

(async () => {
  try {
    console.log('🗓️ Checking teacher schedules...');

    const schedules = await sql`
      SELECT tutor_id, day_of_week, start_time, end_time, is_active
      FROM teacher_schedules 
      ORDER BY tutor_id, day_of_week
    `;

    console.log(`📅 Found ${schedules.length} schedule entries:`);

    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];

    schedules.forEach((s) => {
      const tutorId = s.tutor_id || s.tutorId;
      const dayOfWeek = s.day_of_week || s.dayOfWeek;
      const startTime = s.start_time || s.startTime;
      const endTime = s.end_time || s.endTime;
      const isActive = s.is_active || s.isActive;

      console.log(
        `  Tutor ${tutorId}: ${days[dayOfWeek]} ${startTime}-${endTime} (Active: ${isActive})`
      );
    });

    console.log('\n📋 Recent appointments...');
    const appointments = await sql`
      SELECT tutor_id, appointment_date, start_time, status
      FROM appointments
      ORDER BY appointment_date DESC, start_time DESC
      LIMIT 5
    `;

    appointments.forEach((a) => {
      const tutorId = a.tutor_id || a.tutorId;
      const date = a.appointment_date || a.appointmentDate;
      const startTime = a.start_time || a.startTime;
      const status = a.status;

      console.log(`  Tutor ${tutorId}: ${date} at ${startTime} (${status})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
