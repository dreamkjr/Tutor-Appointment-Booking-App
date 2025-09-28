import sql from './db.js';

async function createTestBooking() {
  try {
    console.log('🧪 Creating test booking...');

    // First, let's see what students exist
    const students = await sql`
      SELECT id, name, email 
      FROM users 
      WHERE role = 'student'
      ORDER BY id
      LIMIT 5
    `;

    console.log('👥 Available students:');
    students.forEach((student) => {
      console.log(`  - ID: ${student.id}, Name: ${student.name}`);
    });

    if (students.length === 0) {
      console.log('❌ No students found! Creating test student...');
      const newStudent = await sql`
        INSERT INTO users (name, email, role) 
        VALUES ('Test Student', 'test@student.com', 'student')
        RETURNING id, name, email
      `;
      students.push(newStudent[0]);
      console.log('✅ Created test student:', newStudent[0]);
    }

    // Get a tutor
    const tutors = await sql`
      SELECT t.id as tutor_id, u.name, u.email
      FROM tutors t
      JOIN users u ON t.user_id = u.id
      WHERE t.is_active = true
      LIMIT 1
    `;

    if (tutors.length === 0) {
      console.log('❌ No tutors found!');
      return;
    }

    const studentId = students[0].id;
    const tutorId = tutors[0].tutor_id;

    console.log(
      `📅 Creating appointment for Student ID: ${studentId}, Tutor ID: ${tutorId}`
    );

    // Create a test appointment
    const appointment = await sql`
      INSERT INTO appointments (
        student_id, 
        tutor_id, 
        appointment_date, 
        start_time, 
        end_time, 
        status, 
        notes
      ) VALUES (
        ${studentId},
        ${tutorId},
        '2025-09-29',
        '14:00:00',
        '15:00:00',
        'scheduled',
        'Test appointment for debugging'
      )
      RETURNING *
    `;

    console.log('✅ Created test appointment:', appointment[0]);

    // Now fetch appointments for this student to verify
    console.log(`🔍 Fetching appointments for student ID: ${studentId}`);
    const fetchedAppointments = await sql`
      SELECT 
        a.id,
        a.student_id,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.status,
        a.notes,
        t.subject,
        u.name as tutor_name,
        u.email as tutor_email
      FROM appointments a
      JOIN tutors t ON a.tutor_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE a.student_id = ${studentId}
      ORDER BY a.appointment_date DESC, a.start_time DESC
    `;

    console.log(
      `📋 Found ${fetchedAppointments.length} appointments for student:`
    );
    fetchedAppointments.forEach((apt) => {
      console.log(
        `  - ID: ${apt.id}, Date: ${apt.appointment_date}, Time: ${apt.start_time}, Tutor: ${apt.tutor_name}`
      );
    });
  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

createTestBooking();
