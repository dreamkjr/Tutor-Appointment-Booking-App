// API response types for type-safe API communication

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  success: false;
  message: string;
  error?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface LoadingState {
  bookings: boolean;
  slots: boolean;
  action: boolean;
}

export interface ModalState {
  isOpen: boolean;
  type: string;
  data: any;
}

export interface AppointmentOperationResult {
  success: boolean;
  error?: string;
}