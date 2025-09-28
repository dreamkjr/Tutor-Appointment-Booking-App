import sql from './db.js';

async function cleanup() {
  try {
    console.log('🔍 Checking all appointments...');

    // Get all appointments to see what exists
    const allAppointments = await sql`
      SELECT id, tutor_id, appointment_date, start_time, end_time, status, student_id
      FROM appointments
      ORDER BY id
    `;

    console.log('📊 All appointments:', allAppointments);

    // Find and delete any appointment with the conflicting slot
    const conflictingAppointment = await sql`
      SELECT id, tutor_id, appointment_date, start_time, status
      FROM appointments
      WHERE tutor_id = 1 
        AND appointment_date = '2025-09-29'
        AND start_time = '09:00:00'
    `;

    console.log('⚡ Conflicting appointments found:', conflictingAppointment);

    if (conflictingAppointment.length > 0) {
      console.log('🗑️ Deleting conflicting appointments...');
      const deleted = await sql`
        DELETE FROM appointments 
        WHERE tutor_id = 1 
          AND appointment_date = '2025-09-29'
          AND start_time = '09:00:00'
        RETURNING id, tutor_id, appointment_date, start_time
      `;

      console.log('✅ Deleted appointments:', deleted);
    } // Also clean up any null appointments
    const nullAppointments = await sql`
      DELETE FROM appointments 
      WHERE appointment_date IS NULL OR start_time IS NULL
      RETURNING id, appointment_date, start_time
    `;

    console.log('🧹 Cleaned null appointments:', nullAppointments);

    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    process.exit(1);
  }
}

cleanup();
