import sql, { testConnection } from '../db.js';

const createTables = async () => {
  try {
    console.log('🚀 Starting database setup...');

    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Cannot proceed without database connection');
    }

    // Create users table (for both tutors and students)
    console.log('📝 Creating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) CHECK (role IN ('tutor', 'student')) DEFAULT 'student',
        phone VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create tutors table (extended information for tutors)
    console.log('📝 Creating tutors table...');
    await sql`
      CREATE TABLE IF NOT EXISTS tutors (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(100) NOT NULL,
        experience_years INTEGER DEFAULT 0,
        hourly_rate DECIMAL(10, 2),
        bio TEXT,
        availability_start TIME DEFAULT '09:00:00',
        availability_end TIME DEFAULT '17:00:00',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `;

    // Create appointments table
    console.log('📝 Creating appointments table...');
    await sql`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        tutor_id INTEGER REFERENCES tutors(id) ON DELETE CASCADE,
        appointment_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        status VARCHAR(50) CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tutor_id, appointment_date, start_time)
      )
    `;

    // Create indexes for better performance
    console.log('📝 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_student_id ON appointments(student_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_tutor_id ON appointments(tutor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tutors_active ON tutors(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`;

    // Create trigger function to update updated_at timestamp
    console.log('📝 Creating trigger functions...');
    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `;

    // Create triggers for auto-updating updated_at
    await sql`DROP TRIGGER IF EXISTS update_users_updated_at ON users`;
    await sql`
      CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`DROP TRIGGER IF EXISTS update_tutors_updated_at ON tutors`;
    await sql`
      CREATE TRIGGER update_tutors_updated_at 
        BEFORE UPDATE ON tutors 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;

    await sql`DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments`;
    await sql`
      CREATE TRIGGER update_appointments_updated_at 
        BEFORE UPDATE ON appointments 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
    `;

    console.log('✅ Database tables created successfully!');

    // Insert sample data for development
    console.log('📝 Inserting sample data...');
    await insertSampleData();

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    await sql.end();
  }
};

const insertSampleData = async () => {
  try {
    // Insert sample users
    const users = await sql`
      INSERT INTO users (email, name, role, phone) VALUES
      ('john.tutor@example.com', 'John Smith', 'tutor', '+1-555-0101'),
      ('jane.student@example.com', 'Jane Doe', 'student', '+1-555-0102'),
      ('mike.student@example.com', 'Mike Johnson', 'student', '+1-555-0103'),
      ('sarah.tutor@example.com', 'Sarah Wilson', 'tutor', '+1-555-0104')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name, role
    `;

    if (users.length > 0) {
      console.log('✅ Sample users created:', users.length);

      // Get tutor user IDs
      const tutorUsers = await sql`
        SELECT id, name FROM users WHERE role = 'tutor'
      `;

      // Insert sample tutors
      for (const tutorUser of tutorUsers) {
        await sql`
          INSERT INTO tutors (user_id, subject, experience_years, hourly_rate, bio, availability_start, availability_end)
          VALUES (
            ${tutorUser.id},
            ${tutorUser.name.includes('John') ? 'Mathematics' : 'English'},
            ${Math.floor(Math.random() * 10) + 1},
            ${(Math.random() * 50 + 25).toFixed(2)},
            ${'Experienced tutor passionate about helping students succeed.'},
            '09:00:00',
            '17:00:00'
          )
          ON CONFLICT (user_id) DO NOTHING
        `;
      }

      console.log('✅ Sample tutors created');

      // Insert sample appointments for the next few days
      const students =
        await sql`SELECT id FROM users WHERE role = 'student' LIMIT 2`;
      const tutors = await sql`SELECT id FROM tutors LIMIT 2`;

      if (students.length > 0 && tutors.length > 0) {
        const today = new Date();
        const appointments = [];

        // Create appointments for the next 7 days
        for (let i = 1; i <= 3; i++) {
          const appointmentDate = new Date(today);
          appointmentDate.setDate(today.getDate() + i);

          const hours = [10, 14, 11]; // 10 AM, 2 PM, 11 AM
          const hour = hours[i - 1];

          appointments.push({
            student_id: students[i % students.length].id,
            tutor_id: tutors[i % tutors.length].id,
            appointment_date: appointmentDate.toISOString().split('T')[0],
            start_time: `${hour.toString().padStart(2, '0')}:00:00`,
            end_time: `${(hour + 1).toString().padStart(2, '0')}:00:00`,
            status: 'scheduled',
            notes: 'Sample tutoring session',
          });
        }

        for (const appointment of appointments) {
          await sql`
            INSERT INTO appointments (student_id, tutor_id, appointment_date, start_time, end_time, status, notes)
            VALUES (${appointment.student_id}, ${appointment.tutor_id}, ${appointment.appointment_date}, 
                   ${appointment.start_time}, ${appointment.end_time}, ${appointment.status}, ${appointment.notes})
            ON CONFLICT (tutor_id, appointment_date, start_time) DO NOTHING
          `;
        }

        console.log('✅ Sample appointments created');
      }
    } else {
      console.log('ℹ️  Sample data already exists, skipping...');
    }
  } catch (error) {
    console.error('❌ Error inserting sample data:', error);
    // Don't throw error here as sample data is optional
  }
};

// Run the setup
createTables().catch((error) => {
  console.error('❌ Database setup failed:', error);
  process.exit(1);
});
