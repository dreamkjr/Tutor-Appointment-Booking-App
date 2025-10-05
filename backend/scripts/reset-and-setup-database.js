import sql, { testConnection } from '../db.js';

const dropAllTables = async () => {
  try {
    console.log('🗑️ Dropping all existing tables...');

    // Drop tables in reverse dependency order to avoid foreign key constraints
    await sql`DROP TABLE IF EXISTS appointments CASCADE`;
    await sql`DROP TABLE IF EXISTS teacher_schedules CASCADE`;
    await sql`DROP TABLE IF EXISTS tutor_subjects CASCADE`;
    await sql`DROP TABLE IF EXISTS tutors CASCADE`;
    await sql`DROP TABLE IF EXISTS subjects CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;

    // Drop any leftover functions and triggers
    await sql`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE`;

    console.log('✅ All tables dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping tables:', error);
    throw error;
  }
};

const createEnhancedTables = async () => {
  try {
    console.log('🚀 Creating enhanced database tables...');

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

    // Create appointments table (updated with subject_id)
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
      const triggerName = `update_${table}_updated_at`;
      await sql`DROP TRIGGER IF EXISTS ${sql.unsafe(
        triggerName
      )} ON ${sql.unsafe(table)}`;
      await sql`
        CREATE TRIGGER ${sql.unsafe(triggerName)}
          BEFORE UPDATE ON ${sql.unsafe(table)}
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
      `;
    }

    console.log('✅ Enhanced database tables created successfully!');
    return true;
  } catch (error) {
    console.error('❌ Database table creation failed:', error);
    throw error;
  }
};

const seedComprehensiveData = async () => {
  try {
    console.log('🌱 Seeding comprehensive sample data...');

    // Insert subjects
    console.log('📚 Adding subjects...');
    const subjects = [
      {
        name: 'Mathematics',
        description: 'Algebra, Calculus, Geometry, Statistics, Number Theory',
      },
      {
        name: 'English',
        description:
          'Literature, Grammar, Writing, Reading Comprehension, Essay Writing',
      },
      {
        name: 'Physics',
        description:
          'Mechanics, Thermodynamics, Electromagnetism, Quantum Physics',
      },
      {
        name: 'Chemistry',
        description:
          'Organic Chemistry, Inorganic Chemistry, Physical Chemistry, Biochemistry',
      },
      {
        name: 'Biology',
        description:
          'Cell Biology, Genetics, Ecology, Anatomy, Molecular Biology',
      },
      {
        name: 'Computer Science',
        description:
          'Programming, Data Structures, Algorithms, Web Development',
      },
      {
        name: 'History',
        description:
          'World History, American History, European History, Ancient Civilizations',
      },
      {
        name: 'Economics',
        description:
          'Microeconomics, Macroeconomics, Business Economics, International Trade',
      },
    ];

    for (const subject of subjects) {
      await sql`
        INSERT INTO subjects (name, description)
        VALUES (${subject.name}, ${subject.description})
        ON CONFLICT (name) DO NOTHING
      `;
    }

    // Insert users (both tutors and students)
    console.log('👥 Adding users...');
    const users = [
      // Tutors
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
        email: 'mike.science@example.com',
        name: 'Mike Johnson',
        role: 'tutor',
        phone: '+1-555-0105',
      },
      {
        email: 'lisa.bio@example.com',
        name: 'Lisa Chen',
        role: 'tutor',
        phone: '+1-555-0106',
      },
      // Students
      {
        email: 'jane.student@example.com',
        name: 'Jane Doe',
        role: 'student',
        phone: '+1-555-0102',
      },
      {
        email: 'alex.student@example.com',
        name: 'Alex Rodriguez',
        role: 'student',
        phone: '+1-555-0103',
      },
      {
        email: 'emma.student@example.com',
        name: 'Emma Thompson',
        role: 'student',
        phone: '+1-555-0107',
      },
    ];

    for (const user of users) {
      await sql`
        INSERT INTO users (email, name, role, phone)
        VALUES (${user.email}, ${user.name}, ${user.role}, ${user.phone})
        ON CONFLICT (email) DO NOTHING
      `;
    }

    // Insert tutors with detailed information
    console.log('👨‍🏫 Adding tutor profiles...');
    const tutorData = [
      {
        email: 'john.math@example.com',
        experience_years: 9,
        hourly_rate: 61.37,
        bio: 'Experienced mathematics tutor with PhD in Applied Mathematics. Specializes in calculus, algebra, and statistics. Passionate about helping students overcome math anxiety.',
      },
      {
        email: 'sarah.english@example.com',
        experience_years: 5,
        hourly_rate: 58.35,
        bio: 'English literature graduate with MA in Creative Writing. Expert in essay writing, grammar, and literature analysis. Published author with teaching certification.',
      },
      {
        email: 'mike.science@example.com',
        experience_years: 7,
        hourly_rate: 65.5,
        bio: 'Physics and Chemistry double major with research experience. Excellent at explaining complex scientific concepts in simple terms. Former lab instructor.',
      },
      {
        email: 'lisa.bio@example.com',
        experience_years: 4,
        hourly_rate: 59.75,
        bio: 'Biology PhD student specializing in molecular biology and genetics. Passionate about life sciences and helping pre-med students succeed.',
      },
    ];

    for (const tutor of tutorData) {
      const userResult =
        await sql`SELECT id FROM users WHERE email = ${tutor.email}`;
      if (userResult.length > 0) {
        await sql`
          INSERT INTO tutors (user_id, experience_years, hourly_rate, bio)
          VALUES (${userResult[0].id}, ${tutor.experience_years}, ${tutor.hourly_rate}, ${tutor.bio})
          ON CONFLICT (user_id) DO NOTHING
        `;
      }
    }

    // Set up tutor-subject relationships
    console.log('🔗 Setting up tutor-subject relationships...');
    const tutorSubjectMappings = [
      { email: 'john.math@example.com', subjects: ['Mathematics', 'Physics'] },
      { email: 'sarah.english@example.com', subjects: ['English', 'History'] },
      {
        email: 'mike.science@example.com',
        subjects: ['Physics', 'Chemistry', 'Mathematics'],
      },
      { email: 'lisa.bio@example.com', subjects: ['Biology', 'Chemistry'] },
    ];

    for (const mapping of tutorSubjectMappings) {
      const userResult =
        await sql`SELECT id FROM users WHERE email = ${mapping.email}`;
      if (userResult.length > 0) {
        const tutorResult =
          await sql`SELECT id FROM tutors WHERE user_id = ${userResult[0].id}`;
        if (tutorResult.length > 0) {
          const tutorId = tutorResult[0].id;

          for (const subjectName of mapping.subjects) {
            const subjectResult =
              await sql`SELECT id FROM subjects WHERE name = ${subjectName}`;
            if (subjectResult.length > 0) {
              await sql`
                INSERT INTO tutor_subjects (tutor_id, subject_id, is_active)
                VALUES (${tutorId}, ${subjectResult[0].id}, true)
                ON CONFLICT (tutor_id, subject_id) DO NOTHING
              `;
            }
          }
        }
      }
    }

    // Create sample schedules for tutors
    console.log('📅 Creating tutor schedules...');
    const scheduleData = [
      // John Smith (Math/Physics) - Monday to Friday, 9 AM to 5 PM
      {
        email: 'john.math@example.com',
        subject: 'Mathematics',
        schedules: [
          { day: 1, start: '09:00', end: '12:00' }, // Monday
          { day: 2, start: '09:00', end: '12:00' }, // Tuesday
          { day: 3, start: '14:00', end: '17:00' }, // Wednesday
          { day: 4, start: '09:00', end: '12:00' }, // Thursday
          { day: 5, start: '14:00', end: '17:00' }, // Friday
        ],
      },
      {
        email: 'john.math@example.com',
        subject: 'Physics',
        schedules: [
          { day: 1, start: '14:00', end: '17:00' }, // Monday
          { day: 3, start: '09:00', end: '12:00' }, // Wednesday
          { day: 5, start: '09:00', end: '12:00' }, // Friday
        ],
      },
      // Sarah Wilson (English/History) - Tuesday to Saturday
      {
        email: 'sarah.english@example.com',
        subject: 'English',
        schedules: [
          { day: 2, start: '10:00', end: '15:00' }, // Tuesday
          { day: 3, start: '10:00', end: '15:00' }, // Wednesday
          { day: 4, start: '10:00', end: '15:00' }, // Thursday
          { day: 6, start: '10:00', end: '15:00' }, // Saturday
        ],
      },
      {
        email: 'sarah.english@example.com',
        subject: 'History',
        schedules: [
          { day: 2, start: '16:00', end: '18:00' }, // Tuesday
          { day: 4, start: '16:00', end: '18:00' }, // Thursday
          { day: 6, start: '16:00', end: '18:00' }, // Saturday
        ],
      },
      // Mike Johnson (Physics/Chemistry/Math) - Flexible schedule
      {
        email: 'mike.science@example.com',
        subject: 'Physics',
        schedules: [
          { day: 1, start: '13:00', end: '18:00' }, // Monday
          { day: 3, start: '13:00', end: '18:00' }, // Wednesday
          { day: 5, start: '13:00', end: '18:00' }, // Friday
        ],
      },
      {
        email: 'mike.science@example.com',
        subject: 'Chemistry',
        schedules: [
          { day: 2, start: '09:00', end: '14:00' }, // Tuesday
          { day: 4, start: '09:00', end: '14:00' }, // Thursday
          { day: 6, start: '09:00', end: '14:00' }, // Saturday
        ],
      },
      // Lisa Chen (Biology/Chemistry) - Afternoon availability
      {
        email: 'lisa.bio@example.com',
        subject: 'Biology',
        schedules: [
          { day: 1, start: '15:00', end: '19:00' }, // Monday
          { day: 2, start: '15:00', end: '19:00' }, // Tuesday
          { day: 4, start: '15:00', end: '19:00' }, // Thursday
          { day: 6, start: '10:00', end: '16:00' }, // Saturday
        ],
      },
      {
        email: 'lisa.bio@example.com',
        subject: 'Chemistry',
        schedules: [
          { day: 3, start: '16:00', end: '20:00' }, // Wednesday
          { day: 5, start: '16:00', end: '20:00' }, // Friday
        ],
      },
    ];

    for (const schedule of scheduleData) {
      const userResult =
        await sql`SELECT id FROM users WHERE email = ${schedule.email}`;
      if (userResult.length > 0) {
        const tutorResult =
          await sql`SELECT id FROM tutors WHERE user_id = ${userResult[0].id}`;
        const subjectResult =
          await sql`SELECT id FROM subjects WHERE name = ${schedule.subject}`;

        if (tutorResult.length > 0 && subjectResult.length > 0) {
          const tutorId = tutorResult[0].id;
          const subjectId = subjectResult[0].id;

          for (const slot of schedule.schedules) {
            await sql`
              INSERT INTO teacher_schedules (tutor_id, subject_id, day_of_week, start_time, end_time, is_active)
              VALUES (${tutorId}, ${subjectId}, ${slot.day}, ${slot.start}, ${slot.end}, true)
              ON CONFLICT (tutor_id, subject_id, day_of_week, start_time) DO NOTHING
            `;
          }
        }
      }
    }

    // Create some sample appointments
    console.log('📋 Adding sample appointments...');
    const studentEmail = 'jane.student@example.com';
    const studentResult =
      await sql`SELECT id FROM users WHERE email = ${studentEmail}`;

    if (studentResult.length > 0) {
      const studentId = studentResult[0].id;

      // Get John Smith's tutor ID for Mathematics
      const johnResult = await sql`
        SELECT t.id as tutor_id FROM tutors t 
        JOIN users u ON t.user_id = u.id 
        WHERE u.email = 'john.math@example.com'
      `;
      const mathSubjectResult =
        await sql`SELECT id FROM subjects WHERE name = 'Mathematics'`;

      if (johnResult.length > 0 && mathSubjectResult.length > 0) {
        // Add past appointment (for testing past event styling)
        await sql`
          INSERT INTO appointments (student_id, tutor_id, subject_id, appointment_date, start_time, end_time, status, notes)
          VALUES (${studentId}, ${johnResult[0].tutor_id}, ${mathSubjectResult[0].id}, '2025-10-02', '09:00', '10:00', 'completed', 'Algebra review session')
          ON CONFLICT DO NOTHING
        `;

        // Add upcoming appointment
        await sql`
          INSERT INTO appointments (student_id, tutor_id, subject_id, appointment_date, start_time, end_time, status, notes)
          VALUES (${studentId}, ${johnResult[0].tutor_id}, ${mathSubjectResult[0].id}, '2025-10-06', '11:00', '12:00', 'scheduled', 'Calculus tutoring')
          ON CONFLICT DO NOTHING
        `;
      }
    }

    console.log('✅ Comprehensive sample data seeded successfully!');
  } catch (error) {
    console.error('❌ Failed to seed sample data:', error);
    throw error;
  }
};

const main = async () => {
  try {
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Cannot proceed without database connection');
    }

    console.log('🗄️ Starting complete database reset and setup...\n');

    await dropAllTables();
    console.log('');

    await createEnhancedTables();
    console.log('');

    await seedComprehensiveData();
    console.log('');

    console.log('🎉 Database reset and setup completed successfully!');
    console.log('📊 Database now contains:');
    console.log(
      '  ✅ 8 subjects (Math, English, Physics, Chemistry, Biology, CS, History, Economics)'
    );
    console.log('  ✅ 4 tutors with detailed profiles and expertise');
    console.log('  ✅ 3 students for testing');
    console.log('  ✅ Comprehensive tutor schedules across multiple subjects');
    console.log('  ✅ Sample appointments (both past and upcoming)');
    console.log('  ✅ All foreign key relationships properly established');
    console.log('');
    console.log('🚀 Your enhanced tutoring system is ready!');
  } catch (error) {
    console.error('💥 Database setup failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { dropAllTables, createEnhancedTables, seedComprehensiveData };
