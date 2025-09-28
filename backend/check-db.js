import sql from './db.js';

async function checkAppointments() {
  try {
    console.log('🔍 Checking current appointments in database...');

    const appointments = await sql`
      SELECT 
        a.id,
        a.student_id,
        a.tutor_id,
        a.appointment_date,
        a.start_time,
        a.status,
        u.name as student_name,
        u.email as student_email
      FROM appointments a
      LEFT JOIN users u ON a.student_id = u.id
      ORDER BY a.id DESC 
      LIMIT 10
    `;

    console.log(`📋 Found ${appointments.length} appointments:`);
    appointments.forEach((apt) => {
      console.log(
        `  - ID: ${apt.id}, Student: ${apt.student_name} (ID: ${apt.student_id}), Date: ${apt.appointment_date}, Status: ${apt.status}`
      );
    });

    console.log('\n🔍 Checking students in database...');
    const students = await sql`
      SELECT id, name, email, role 
      FROM users 
      WHERE role = 'student' 
      ORDER BY id
    `;

    console.log(`👥 Found ${students.length} students:`);
    students.forEach((student) => {
      console.log(
        `  - ID: ${student.id}, Name: ${student.name}, Email: ${student.email}`
      );
    });
  } catch (error) {
    console.error('❌ Error checking database:', error);
  }

  process.exit(0);
}

checkAppointments();
