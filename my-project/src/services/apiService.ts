// API service for communicating with the backend with TypeScript type safety
import { ApiResponse, ApiError } from '../types/api';
import {
  Appointment,
  TimeSlot,
  AppointmentCreateData,
  AppointmentUpdateData,
  Subject,
  TutorWithSubject,
  TutorSubject,
  TeacherSchedule,
  TeacherAppointment,
  AvailableSlot,
} from '../types/index';
import {
  getEnvironmentConfig,
  getHealthCheckUrl,
  logEnvironmentInfo,
} from '../utils/environment';

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

class ApiService {
  private baseURL: string;
  private healthCheckURL: string;
  private config: ReturnType<typeof getEnvironmentConfig>;

  constructor() {
    this.config = getEnvironmentConfig();
    this.baseURL = this.config.apiUrl;
    this.healthCheckURL = getHealthCheckUrl();

    // Log environment info for debugging
    logEnvironmentInfo();
  }

  // Generic request method with error handling and type safety
  private async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      credentials: this.config.isCloudWorkstation ? 'include' : 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data: ApiResponse<T> | ApiError = await response.json();

      if (!response.ok) {
        const errorData = data as ApiError;
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      return data as ApiResponse<T>;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get all appointments for the current user
  async getAppointments(studentId: number): Promise<Appointment[]> {
    const response = await this.request<Appointment[]>(
      `/appointments?studentId=${studentId}`
    );
    return response.data || [];
  }

  // Get available time slots (legacy - redirects to teachers endpoint)
  async getAvailableSlots(date: string | null = null): Promise<TimeSlot[]> {
    // For now, redirect to teachers endpoint with default tutor and subject
    // In a real app, this would be handled differently
    const defaultDate = date || new Date().toISOString().split('T')[0];
    const response = await this.request<TimeSlot[]>(
      `/teachers/available-slots?tutorId=1&subjectId=1&date=${defaultDate}`
    );
    return response.data || [];
  }

  // Book a new appointment
  async bookAppointment(
    appointmentData: AppointmentCreateData
  ): Promise<Appointment> {
    const response = await this.request<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
    return response.data!;
  }

  // Update an existing appointment
  async updateAppointment(
    appointmentId: number,
    updateData: AppointmentUpdateData
  ): Promise<Appointment> {
    const response = await this.request<Appointment>(
      `/appointments/${appointmentId}`,
      {
        method: 'PUT',
        body: JSON.stringify(updateData),
      }
    );
    return response.data!;
  }

  // Cancel an appointment
  async cancelAppointment(appointmentId: number): Promise<ApiResponse> {
    const response = await this.request(`/appointments/${appointmentId}`, {
      method: 'DELETE',
    });
    return response;
  }

  // Check API health
  async healthCheck(): Promise<{ status: string; message?: string }> {
    try {
      const response = await fetch(this.healthCheckURL, {
        method: 'GET',
        credentials: this.config.isCloudWorkstation ? 'include' : 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { status: 'error', message: errorMessage };
    }
  }

  // Get all students from the database
  async getStudents(): Promise<any[]> {
    const response = await this.request<any[]>('/students');
    return response.data || [];
  }

  // Get a specific student by ID
  async getStudentById(studentId: number): Promise<any> {
    const response = await this.request<any>(`/students/${studentId}`);
    return response.data;
  }

  // Teacher/Subject Management Methods

  // Get all subjects
  async getSubjects(): Promise<Subject[]> {
    const response = await this.request<Subject[]>('/teachers/subjects');
    return response.data || [];
  }

  // Get tutors by subject
  async getTutorsBySubject(subjectId: number): Promise<TutorWithSubject[]> {
    const response = await this.request<TutorWithSubject[]>(
      `/teachers/subjects/${subjectId}/tutors`
    );
    return response.data || [];
  }

  // Get tutor's subjects
  async getTutorSubjects(tutorId: number): Promise<TutorSubject[]> {
    const response = await this.request<TutorSubject[]>(
      `/teachers/tutors/${tutorId}/subjects`
    );
    return response.data || [];
  }

  // Add subject to tutor
  async addTutorSubject(
    tutorId: number,
    subjectId: number
  ): Promise<TutorSubject> {
    const response = await this.request<TutorSubject>(
      `/teachers/tutors/${tutorId}/subjects`,
      {
        method: 'POST',
        body: JSON.stringify({ subjectId }),
      }
    );
    return response.data!;
  }

  // Remove subject from tutor
  async removeTutorSubject(tutorId: number, subjectId: number): Promise<void> {
    await this.request(`/teachers/tutors/${tutorId}/subjects/${subjectId}`, {
      method: 'DELETE',
    });
  }

  // Get teacher's schedule
  async getTeacherSchedule(tutorId: number): Promise<TeacherSchedule[]> {
    const response = await this.request<TeacherSchedule[]>(
      `/teachers/tutors/${tutorId}/schedule`
    );
    return response.data || [];
  }

  // Add schedule slot
  async addScheduleSlot(
    tutorId: number,
    scheduleData: {
      subjectId: number;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }
  ): Promise<TeacherSchedule> {
    const response = await this.request<TeacherSchedule>(
      `/teachers/tutors/${tutorId}/schedule`,
      {
        method: 'POST',
        body: JSON.stringify(scheduleData),
      }
    );
    return response.data!;
  }

  // Update schedule slot
  async updateScheduleSlot(
    tutorId: number,
    scheduleId: number,
    scheduleData: {
      subjectId: number;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }
  ): Promise<TeacherSchedule> {
    const response = await this.request<TeacherSchedule>(
      `/teachers/tutors/${tutorId}/schedule/${scheduleId}`,
      {
        method: 'PUT',
        body: JSON.stringify(scheduleData),
      }
    );
    return response.data!;
  }

  // Delete schedule slot
  async deleteScheduleSlot(tutorId: number, scheduleId: number): Promise<void> {
    await this.request(`/teachers/tutors/${tutorId}/schedule/${scheduleId}`, {
      method: 'DELETE',
    });
  }

  // Get available time slots for booking
  async getAvailableTimeSlots(
    tutorId: number,
    subjectId: number,
    date: string
  ): Promise<AvailableSlot[]> {
    // Get user's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const response = await this.request<AvailableSlot[]>(
      `/teachers/available-slots?tutorId=${tutorId}&subjectId=${subjectId}&date=${date}&timezone=${encodeURIComponent(
        timezone
      )}`
    );
    return response.data || [];
  }

  // Get teacher's appointments
  async getTeacherAppointments(tutorId: number): Promise<TeacherAppointment[]> {
    const response = await this.request<TeacherAppointment[]>(
      `/teachers/tutors/${tutorId}/appointments`
    );
    return response.data || [];
  }

  // Get all teachers for booking selection
  async getAllTeachers(): Promise<
    Array<{
      id: number;
      name: string;
      email: string;
      experienceYears?: number;
      bio?: string;
    }>
  > {
    const response = await this.request<
      Array<{
        id: number;
        name: string;
        email: string;
        experience_years?: number;
        bio?: string;
      }>
    >('/teachers/all');

    return (response.data || []).map((teacher) => ({
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      experienceYears: teacher.experience_years,
      bio: teacher.bio,
    }));
  }

  // Get available dates for a teacher
  async getTeacherAvailableDates(
    tutorId: number,
    startDate: string,
    endDate: string
  ): Promise<string[]> {
    const response = await this.request<string[]>(
      `/teachers/tutors/${tutorId}/available-dates?startDate=${startDate}&endDate=${endDate}`
    );
    return response.data || [];
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
