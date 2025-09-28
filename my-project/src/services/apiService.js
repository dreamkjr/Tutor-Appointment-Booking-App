// API service for communicating with the backend
const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic request method with error handling
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get all appointments for the current user
  async getAppointments(studentId = 1) {
    const response = await this.request(`/appointments?studentId=${studentId}`);
    return response.data;
  }

  // Get available time slots
  async getAvailableSlots(date = null) {
    const query = date ? `?date=${date}` : '';
    const response = await this.request(
      `/appointments/available-slots${query}`
    );
    return response.data;
  }

  // Book a new appointment
  async bookAppointment(appointmentData) {
    const response = await this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
    return response.data;
  }

  // Update an existing appointment
  async updateAppointment(appointmentId, updateData) {
    const response = await this.request(`/appointments/${appointmentId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return response.data;
  }

  // Cancel an appointment
  async cancelAppointment(appointmentId) {
    const response = await this.request(`/appointments/${appointmentId}`, {
      method: 'DELETE',
    });
    return response;
  }

  // Check API health
  async healthCheck() {
    try {
      const response = await fetch(
        `${this.baseURL.replace('/api/v1', '')}/health`
      );
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      return { status: 'error', message: error.message };
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
