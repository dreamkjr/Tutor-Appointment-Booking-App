import sql, { testConnection } from '../db.js';

async function resetDatabase() {
  try {
    console.log('🗑️ Dropping all tables...');

    // Drop all tables in correct order
    await sql`DROP TABLE IF EXISTS appointments CASCADE`;
    await sql`DROP TABLE IF EXISTS teacher_schedules CASCADE`;
    await sql`DROP TABLE IF EXISTS tutor_subjects CASCADE`;
    await sql`DROP TABLE IF EXISTS tutors CASCADE`;
    await sql`DROP TABLE IF EXISTS subjects CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;

    console.log('✅ All tables dropped');

    console.log('📝 Creating new tables...');

    // Users table
    await sql`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) CHECK (role IN ('tutor', 'student')) DEFAULT 'student',
        phone VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Subjects table
    await sql`
      CREATE TABLE subjects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Tutors table
    await sql`
      CREATE TABLE tutors (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        experience_years INTEGER DEFAULT 0,
        hourly_rate DECIMAL(10, 2),
        bio TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `;

    // Tutor subjects relationship
    await sql`
      CREATE TABLE tutor_subjects (
        id SERIAL PRIMARY KEY,
        tutor_id INTEGER REFERENCES tutors(id) ON DELETE CASCADE,
        subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
        hourly_rate DECIMAL(10, 2),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tutor_id, subject_id)
      )
    `;

    // Teacher schedules
    await sql`
      CREATE TABLE teacher_schedules (
        id SERIAL PRIMARY KEY,
        tutor_id INTEGER REFERENCES tutors(id) ON DELETE CASCADE,
        subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
        day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT valid_time_range CHECK (start_time < end_time),
        UNIQUE(tutor_id, subject_id, day_of_week, start_time)
      )
    `;

    // Appointments table
    await sql`
      CREATE TABLE appointments (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        tutor_id INTEGER REFERENCES tutors(id) ON DELETE CASCADE,
        subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
        appointment_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        status VARCHAR(50) CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tutor_id, subject_id, appointment_date, start_time)
      )
    `;

    console.log('✅ Tables created');

    console.log('🌱 Adding sample data...');

    // Add subjects
    await sql`INSERT INTO subjects (name, description) VALUES 
      ('Mathematics', 'Algebra, Calculus, Geometry, Statistics'),
      ('English', 'Literature, Grammar, Writing, Reading'),
      ('Physics', 'Mechanics, Thermodynamics, Electromagnetism'),
      ('Chemistry', 'Organic, Inorganic, Physical Chemistry'),
      ('Biology', 'Cell Biology, Genetics, Ecology'),
      ('Computer Science', 'Programming, Data Structures, Algorithms')`;

    // Add users
    await sql`INSERT INTO users (email, name, role, phone) VALUES 
      ('john.math@example.com', 'John Smith', 'tutor', '+1-555-0101'),
      ('sarah.english@example.com', 'Sarah Wilson', 'tutor', '+1-555-0104'),
      ('jane.student@example.com', 'Jane Doe', 'student', '+1-555-0102'),
      ('mike.student@example.com', 'Mike Johnson', 'student', '+1-555-0103')`;

    // Add tutors
    await sql`INSERT INTO tutors (user_id, experience_years, hourly_rate, bio) VALUES 
      (1, 9, 61.37, 'Experienced mathematics tutor passionate about helping students'),
      (2, 5, 58.35, 'English literature expert with focus on writing skills')`;

    // Add tutor subjects
    await sql`INSERT INTO tutor_subjects (tutor_id, subject_id) VALUES 
      (1, 1), (1, 3),
      (2, 2)`;

    // Add some schedules
    await sql`INSERT INTO teacher_schedules (tutor_id, subject_id, day_of_week, start_time, end_time) VALUES 
      (1, 1, 1, '09:00', '17:00'), (1, 1, 2, '09:00', '17:00'), (1, 1, 3, '09:00', '17:00'),
      (1, 1, 4, '09:00', '17:00'), (1, 1, 5, '09:00', '17:00'),
      (2, 2, 1, '10:00', '18:00'), (2, 2, 2, '10:00', '18:00'), (2, 2, 3, '10:00', '18:00'),
      (2, 2, 4, '10:00', '18:00'), (2, 2, 5, '10:00', '18:00')`;

    // Add sample appointment
    await sql`INSERT INTO appointments (student_id, tutor_id, subject_id, appointment_date, start_time, end_time, status, notes) VALUES 
      (3, 1, 1, '2025-10-02', '09:00', '10:00', 'completed', 'Past appointment'),
      (3, 1, 1, '2025-10-06', '15:00', '16:00', 'scheduled', 'Upcoming appointment')`;

    console.log('✅ Sample data added');
    console.log('🎉 Database reset complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

resetDatabase();
