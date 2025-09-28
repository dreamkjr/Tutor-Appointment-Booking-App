// Authentication related types and interfaces
export interface Student {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at?: string;
  // UI-specific fields for display
  avatar?: string;
  major?: string;
  year?: string;
}

export interface AuthUser extends Student {
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  studentId: number;
}

export interface AuthContextType {
  user: AuthUser | null;
  students: Student[];
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  refreshStudents: () => Promise<void>;
}

// Avatar mapping for students based on their ID or name
export const getStudentAvatar = (student: Student): string => {
  const avatars = ['👩‍🎓', '👨‍🎓', '👩‍🔬', '👨‍💻', '👩‍📚'];
  return avatars[student.id % avatars.length] || '�';
};

// Generate UI-friendly display data for students
export const enrichStudentData = (student: Student): Student => {
  const majors = [
    'Computer Science',
    'Mathematics',
    'Physics',
    'Engineering',
    'Biology',
  ];
  const years = ['Freshman', 'Sophomore', 'Junior', 'Senior'];

  return {
    ...student,
    avatar: getStudentAvatar(student),
    major: majors[(student.id - 1) % majors.length] || 'Undeclared',
    year: years[(student.id - 1) % years.length] || 'Unknown',
  };
};
