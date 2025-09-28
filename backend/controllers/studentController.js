import sql from '../db.js';

// Get all students from the users table
const getStudents = async (req, res) => {
  try {
    console.log('📚 Fetching students from database...');

    const students = await sql`
      SELECT 
        id,
        name,
        email,
        phone,
        created_at
      FROM users 
      WHERE role = 'student' 
      ORDER BY name ASC
    `;

    console.log(`✅ Found ${students.length} students`);

    res.json({
      success: true,
      data: students,
      message: 'Students retrieved successfully',
    });
  } catch (error) {
    console.error('❌ Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message,
    });
  }
};

// Get a specific student by ID
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📚 Fetching student with ID: ${id}`);

    const student = await sql`
      SELECT 
        id,
        name,
        email,
        phone,
        created_at
      FROM users 
      WHERE id = ${id} AND role = 'student'
    `;

    if (student.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    console.log(`✅ Found student: ${student[0].name}`);

    res.json({
      success: true,
      data: student[0],
      message: 'Student retrieved successfully',
    });
  } catch (error) {
    console.error('❌ Error fetching student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student',
      error: error.message,
    });
  }
};

export { getStudents, getStudentById };
