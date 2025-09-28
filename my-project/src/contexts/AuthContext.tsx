// Authentication context and provider for managing user state
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import type {
  AuthContextType,
  AuthUser,
  LoginCredentials,
  Student,
} from '../types/auth';
import { enrichStudentData } from '../types/auth';
import apiService from '../services/apiService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch students from API
  const refreshStudents = async (): Promise<void> => {
    try {
      const studentsData = await apiService.getStudents();
      const enrichedStudents = studentsData.map(enrichStudentData);
      setStudents(enrichedStudents);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setError('Failed to load student data');
    }
  };

  // Check for saved user session and load students on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Load students from API
        await refreshStudents();

        // Check for saved user session
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser) as AuthUser;
            setUser(userData);
          } catch (err) {
            console.error('Failed to parse saved user data:', err);
            localStorage.removeItem('currentUser');
          }
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      // Find the student by ID from loaded students
      const student = students.find((s) => s.id === credentials.studentId);

      if (!student) {
        setError('Student not found. Please check your Student ID.');
        return false;
      }

      // Create authenticated user
      const authUser: AuthUser = {
        ...student,
        isAuthenticated: true,
      };

      // Save to state and localStorage
      setUser(authUser);
      localStorage.setItem('currentUser', JSON.stringify(authUser));

      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    setError(null);
  };

  const value: AuthContextType = {
    user,
    students,
    login,
    logout,
    isLoading,
    error,
    refreshStudents,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
