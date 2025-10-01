// API service for communicating with the backend with TypeScript type safety
import { ApiResponse, ApiError } from '../types/api';
import {
  Appointment,
  TimeSlot,
  AppointmentCreateData,
  AppointmentUpdateData,
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

  // Get available time slots
  async getAvailableSlots(date: string | null = null): Promise<TimeSlot[]> {
    const query = date ? `?date=${date}` : '';
    const response = await this.request<TimeSlot[]>(
      `/appointments/available-slots${query}`
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
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
