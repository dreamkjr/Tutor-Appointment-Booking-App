import sql, { testConnection } from '../db.js';

const createEnhancedTables = async () => {
  try {
    console.log('🚀 Starting enhanced database setup...');

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

    // Create subjects table (centralized subject management)
    console.log('📝 Creating subjects table...');
    await sql`
      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create tutors table (simplified - removed availability_start/end and subject)
    console.log('📝 Creating tutors table...');
    await sql`
      CREATE TABLE IF NOT EXISTS tutors (
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

    // Create tutor_subjects table (many-to-many relationship)
    console.log('📝 Creating tutor_subjects table...');
    await sql`
      CREATE TABLE IF NOT EXISTS tutor_subjects (
        id SERIAL PRIMARY KEY,
        tutor_id INTEGER REFERENCES tutors(id) ON DELETE CASCADE,
        subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
        hourly_rate DECIMAL(10, 2), -- Subject-specific rate (optional override)
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tutor_id, subject_id)
      )
    `;

    // Create teacher_schedules table (detailed availability)
    console.log('📝 Creating teacher_schedules table...');
    await sql`
      CREATE TABLE IF NOT EXISTS teacher_schedules (
        id SERIAL PRIMARY KEY,
        tutor_id INTEGER REFERENCES tutors(id) ON DELETE CASCADE,
        subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
        day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT valid_time_range CHECK (start_time < end_time),
        UNIQUE(tutor_id, subject_id, day_of_week, start_time)
      )
    `;

    // Create appointments table (updated)
    console.log('📝 Creating appointments table...');
    await sql`
      CREATE TABLE IF NOT EXISTS appointments (
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

    // Create indexes for better performance
    console.log('📝 Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_student_id ON appointments(student_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_tutor_id ON appointments(tutor_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_subject_id ON appointments(subject_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tutors_active ON tutors(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_tutor_subjects_active ON tutor_subjects(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_teacher_schedules_active ON teacher_schedules(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_teacher_schedules_day ON teacher_schedules(day_of_week)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active)`;

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
    const tables = ['users', 'tutors', 'teacher_schedules', 'appointments'];
    for (const table of tables) {
      await sql`DROP TRIGGER IF EXISTS ${{
        raw: `update_${table}_updated_at`,
      }} ON ${{ raw: table }}`;
      await sql`
        CREATE TRIGGER ${{ raw: `update_${table}_updated_at` }}
          BEFORE UPDATE ON ${{ raw: table }}
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `;
    }

    console.log('✅ Enhanced database setup completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
};

const seedInitialData = async () => {
  try {
    console.log('🌱 Seeding initial data...');

    // Insert default subjects
    const subjects = [
      {
        name: 'Mathematics',
        description: 'Algebra, Calculus, Geometry, Statistics',
      },
      {
        name: 'English',
        description: 'Literature, Grammar, Writing, Reading Comprehension',
      },
      {
        name: 'Physics',
        description: 'Mechanics, Thermodynamics, Electromagnetism',
      },
      {
        name: 'Chemistry',
        description: 'Organic, Inorganic, Physical Chemistry',
      },
      {
        name: 'Biology',
        description: 'Cell Biology, Genetics, Ecology, Anatomy',
      },
      {
        name: 'Computer Science',
        description: 'Programming, Data Structures, Algorithms',
      },
      {
        name: 'History',
        description: 'World History, American History, European History',
      },
      {
        name: 'Economics',
        description: 'Microeconomics, Macroeconomics, Business Economics',
      },
    ];

    for (const subject of subjects) {
      await sql`
        INSERT INTO subjects (name, description)
        VALUES (${subject.name}, ${subject.description})
        ON CONFLICT (name) DO NOTHING
      `;
    }

    // Sample users (tutors and students)
    const sampleUsers = [
      {
        email: 'john.math@example.com',
        name: 'John Smith',
        role: 'tutor',
        phone: '+1-555-0101',
      },
      {
        email: 'sarah.english@example.com',
        name: 'Sarah Wilson',
        role: 'tutor',
        phone: '+1-555-0104',
      },
      {
        email: 'jane.student@example.com',
        name: 'Jane Doe',
        role: 'student',
        phone: '+1-555-0102',
      },
      {
        email: 'mike.student@example.com',
        name: 'Mike Johnson',
        role: 'student',
        phone: '+1-555-0103',
      },
    ];

    for (const user of sampleUsers) {
      await sql`
        INSERT INTO users (email, name, role, phone)
        VALUES (${user.email}, ${user.name}, ${user.role}, ${user.phone})
        ON CONFLICT (email) DO NOTHING
      `;
    }

    // Sample tutors
    const johnUserId =
      await sql`SELECT id FROM users WHERE email = 'john.math@example.com'`;
    const sarahUserId =
      await sql`SELECT id FROM users WHERE email = 'sarah.english@example.com'`;

    if (johnUserId.length > 0) {
      await sql`
        INSERT INTO tutors (user_id, experience_years, hourly_rate, bio)
        VALUES (${johnUserId[0].id}, 9, 61.37, 'Experienced tutor passionate about helping students succeed in mathematics')
        ON CONFLICT (user_id) DO NOTHING
      `;
    }

    if (sarahUserId.length > 0) {
      await sql`
        INSERT INTO tutors (user_id, experience_years, hourly_rate, bio)
        VALUES (${sarahUserId[0].id}, 5, 58.35, 'Experienced tutor passionate about helping students with English and Literature')
        ON CONFLICT (user_id) DO NOTHING
      `;
    }

    console.log('✅ Initial data seeded successfully!');
  } catch (error) {
    console.error('❌ Failed to seed initial data:', error);
    throw error;
  }
};

const main = async () => {
  try {
    await createEnhancedTables();
    await seedInitialData();
    console.log('🎉 Database enhancement completed successfully!');
  } catch (error) {
    console.error('💥 Enhancement failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createEnhancedTables, seedInitialData };
