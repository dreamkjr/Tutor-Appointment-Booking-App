import sql from '../db.js';
import { validationResult } from 'express-validator';

// Get all appointments for a specific student
export const getAppointments = async (req, res) => {
  try {
    // For now, we'll use a default student ID (1)
    // In a real app, this would come from authentication
    const studentId = req.query.studentId || 1;

    const appointments = await sql`
      SELECT 
        a.id,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.status,
        a.notes,
        a.created_at,
        t.subject,
        u.name as tutor_name,
        u.email as tutor_email
      FROM appointments a
      JOIN tutors t ON a.tutor_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE a.student_id = ${studentId}
        AND a.status != 'cancelled'
      ORDER BY a.appointment_date ASC, a.start_time ASC
    `;

    // Transform the data to match frontend expectations
    const transformedAppointments = appointments.map((appointment) => ({
      id: appointment.id,
      dateTime: new Date(
        `${appointment.appointmentDate}T${appointment.startTime}`
      ),
      status: appointment.status,
      notes: appointment.notes,
      tutor: {
        name: appointment.tutorName,
        email: appointment.tutorEmail,
        subject: appointment.subject,
      },
      createdAt: appointment.createdAt,
    }));

    res.json({
      success: true,
      data: transformedAppointments,
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Get available time slots
export const getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;

    // If no date specified, get slots for the next 7 days
    const startDate = date ? new Date(date) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);

    // Get all active tutors
    const tutors = await sql`
      SELECT 
        t.id,
        t.availability_start,
        t.availability_end,
        u.name as tutor_name,
        t.subject
      FROM tutors t
      JOIN users u ON t.user_id = u.id
      WHERE t.is_active = true
    `;

    if (tutors.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // For simplicity, we'll use the first tutor
    // In a real app, users would select their preferred tutor
    const tutor = tutors[0];

    // Get existing appointments for this tutor
    const existingAppointments = await sql`
      SELECT appointment_date, start_time
      FROM appointments
      WHERE tutor_id = ${tutor.id}
        AND status = 'scheduled'
        AND appointment_date >= ${startDate.toISOString().split('T')[0]}
        AND appointment_date <= ${endDate.toISOString().split('T')[0]}
    `;

    // Create a set of booked time slots
    const bookedSlots = new Set();
    existingAppointments.forEach((apt) => {
      const slotKey = `${apt.appointmentDate}_${apt.startTime}`;
      bookedSlots.add(slotKey);
    });

    // Generate available slots
    const availableSlots = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      // Skip past dates
      if (currentDate < new Date().setHours(0, 0, 0, 0)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      // Skip weekends (optional - remove if tutoring on weekends is allowed)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const dateStr = currentDate.toISOString().split('T')[0];

      // Generate hourly slots from 9 AM to 5 PM
      for (let hour = 9; hour <= 17; hour++) {
        const timeStr = `${hour.toString().padStart(2, '0')}:00:00`;
        const slotKey = `${dateStr}_${timeStr}`;

        if (!bookedSlots.has(slotKey)) {
          const slotDateTime = new Date(`${dateStr}T${timeStr}`);
          availableSlots.push({
            id: slotKey,
            dateTime: slotDateTime,
            tutorId: tutor.id,
            tutorName: tutor.tutorName,
            subject: tutor.subject,
          });
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    res.json({
      success: true,
      data: availableSlots,
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available slots',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Book a new appointment
export const bookAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { dateTime, tutorId, studentId = 1, notes = '' } = req.body;

    const appointmentDate = new Date(dateTime);
    const dateStr = appointmentDate.toISOString().split('T')[0];
    const startTime = appointmentDate.toTimeString().split(' ')[0];

    // Calculate end time (1 hour session)
    const endDateTime = new Date(appointmentDate.getTime() + 60 * 60 * 1000);
    const endTime = endDateTime.toTimeString().split(' ')[0];

    // Check if the slot is still available
    const existingAppointment = await sql`
      SELECT id FROM appointments
      WHERE tutor_id = ${tutorId}
        AND appointment_date = ${dateStr}
        AND start_time = ${startTime}
        AND status = 'scheduled'
    `;

    if (existingAppointment.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is no longer available',
      });
    }

    // Create the appointment
    const newAppointment = await sql`
      INSERT INTO appointments (student_id, tutor_id, appointment_date, start_time, end_time, status, notes)
      VALUES (${studentId}, ${tutorId}, ${dateStr}, ${startTime}, ${endTime}, 'scheduled', ${notes})
      RETURNING *
    `;

    // Fetch the complete appointment data with tutor info
    const appointmentWithTutor = await sql`
      SELECT 
        a.id,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.status,
        a.notes,
        a.created_at,
        t.subject,
        u.name as tutor_name,
        u.email as tutor_email
      FROM appointments a
      JOIN tutors t ON a.tutor_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE a.id = ${newAppointment[0].id}
    `;

    const appointment = appointmentWithTutor[0];

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        id: appointment.id,
        dateTime: new Date(
          `${appointment.appointmentDate}T${appointment.startTime}`
        ),
        status: appointment.status,
        notes: appointment.notes,
        tutor: {
          name: appointment.tutorName,
          email: appointment.tutorEmail,
          subject: appointment.subject,
        },
        createdAt: appointment.createdAt,
      },
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Update an existing appointment
export const updateAppointment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { dateTime, notes } = req.body;

    // Check if appointment exists and belongs to the student
    const existingAppointment = await sql`
      SELECT * FROM appointments
      WHERE id = ${id} AND status = 'scheduled'
    `;

    if (existingAppointment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or cannot be updated',
      });
    }

    const appointment = existingAppointment[0];
    let updateFields = {};

    // If updating the date/time
    if (dateTime) {
      const newDateTime = new Date(dateTime);
      const dateStr = newDateTime.toISOString().split('T')[0];
      const startTime = newDateTime.toTimeString().split(' ')[0];

      // Calculate end time (1 hour session)
      const endDateTime = new Date(newDateTime.getTime() + 60 * 60 * 1000);
      const endTime = endDateTime.toTimeString().split(' ')[0];

      // Check if the new slot is available
      const conflictingAppointment = await sql`
        SELECT id FROM appointments
        WHERE tutor_id = ${appointment.tutorId}
          AND appointment_date = ${dateStr}
          AND start_time = ${startTime}
          AND status = 'scheduled'
          AND id != ${id}
      `;

      if (conflictingAppointment.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'The new time slot is not available',
        });
      }

      updateFields.appointment_date = dateStr;
      updateFields.start_time = startTime;
      updateFields.end_time = endTime;
    }

    // If updating notes
    if (notes !== undefined) {
      updateFields.notes = notes;
    }

    // Update the appointment
    const updated = await sql`
      UPDATE appointments 
      SET ${sql(updateFields)}
      WHERE id = ${id}
      RETURNING *
    `;

    // Fetch the complete updated appointment data
    const appointmentWithTutor = await sql`
      SELECT 
        a.id,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.status,
        a.notes,
        a.created_at,
        t.subject,
        u.name as tutor_name,
        u.email as tutor_email
      FROM appointments a
      JOIN tutors t ON a.tutor_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE a.id = ${id}
    `;

    const updatedAppointment = appointmentWithTutor[0];

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: {
        id: updatedAppointment.id,
        dateTime: new Date(
          `${updatedAppointment.appointmentDate}T${updatedAppointment.startTime}`
        ),
        status: updatedAppointment.status,
        notes: updatedAppointment.notes,
        tutor: {
          name: updatedAppointment.tutorName,
          email: updatedAppointment.tutorEmail,
          subject: updatedAppointment.subject,
        },
        createdAt: updatedAppointment.createdAt,
      },
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Cancel an appointment
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if appointment exists and can be cancelled
    const existingAppointment = await sql`
      SELECT * FROM appointments
      WHERE id = ${id} AND status = 'scheduled'
    `;

    if (existingAppointment.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or cannot be cancelled',
      });
    }

    // Update appointment status to cancelled
    await sql`
      UPDATE appointments 
      SET status = 'cancelled'
      WHERE id = ${id}
    `;

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
