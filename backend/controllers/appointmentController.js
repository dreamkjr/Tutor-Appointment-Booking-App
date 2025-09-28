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

    console.log(
      '📊 Raw appointments from DB:',
      JSON.stringify(appointments, null, 2)
    );

    // Transform the data to match frontend expectations
    const transformedAppointments = appointments.map((appointment) => {
      // Handle both snake_case and camelCase field names from database
      const appointmentDate =
        appointment.appointment_date || appointment.appointmentDate;
      const startTime = appointment.start_time || appointment.startTime;
      const tutorName = appointment.tutor_name || appointment.tutorName;
      const tutorEmail = appointment.tutor_email || appointment.tutorEmail;
      const createdAt = appointment.created_at || appointment.createdAt;

      console.log('🔄 Processing appointment:', {
        id: appointment.id,
        appointmentDate: appointmentDate,
        startTime: startTime,
        tutorName: tutorName,
      });

      return {
        id: appointment.id,
        dateTime:
          appointmentDate && startTime
            ? new Date(
                `${appointmentDate.toISOString().split('T')[0]}T${startTime}Z`
              )
            : null,
        status: appointment.status,
        notes: appointment.notes,
        tutor: {
          name: tutorName,
          email: tutorEmail,
          subject: appointment.subject,
        },
        createdAt: createdAt,
      };
    });

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
      SELECT id, appointment_date, start_time
      FROM appointments
      WHERE tutor_id = ${tutor.id}
        AND status = 'scheduled'
        AND appointment_date >= ${startDate.toISOString().split('T')[0]}
        AND appointment_date <= ${endDate.toISOString().split('T')[0]}
    `;

    // Create a set of booked time slots
    const bookedSlots = new Set();
    existingAppointments.forEach((apt) => {
      // Handle both snake_case and camelCase field names
      const appointmentDate = apt.appointment_date || apt.appointmentDate;
      const startTime = apt.start_time || apt.startTime;

      if (appointmentDate && startTime) {
        // Format date consistently
        const dateStr =
          appointmentDate instanceof Date
            ? appointmentDate.toISOString().split('T')[0]
            : appointmentDate;
        const slotKey = `${dateStr}_${startTime}`;
        bookedSlots.add(slotKey);

        console.log(
          `🚫 Blocking booked slot: ${slotKey} (ID: ${apt.id || 'unknown'})`
        );
      }
    });

    console.log(`📋 Total booked slots found: ${bookedSlots.size}`);
    console.log(`🔒 Booked slots:`, Array.from(bookedSlots));

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
        const isBooked = bookedSlots.has(slotKey);

        // Create UTC date to avoid timezone issues
        const slotDateTime = new Date(`${dateStr}T${timeStr}Z`);

        // Always add the slot, but mark if it's booked
        availableSlots.push({
          id: slotKey,
          dateTime: slotDateTime,
          tutorId: tutor.id,
          tutorName: tutor.tutorName,
          subject: tutor.subject,
          isBooked: isBooked,
        });

        if (isBooked) {
          console.log(`❌ Booked slot (disabled): ${slotKey}`);
        } else {
          console.log(`✅ Available slot: ${slotKey}`);
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
    console.log('📝 Booking request received:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { dateTime, tutorId, studentId = 1, notes = '' } = req.body;
    console.log('📋 Extracted data:', { dateTime, tutorId, studentId, notes });

    // Ensure we're working with a proper Date object
    let appointmentDate;
    if (typeof dateTime === 'string') {
      appointmentDate = new Date(dateTime);
    } else if (dateTime instanceof Date) {
      appointmentDate = dateTime;
    } else {
      throw new Error('Invalid dateTime format');
    }

    // Validate the date
    if (isNaN(appointmentDate.getTime())) {
      throw new Error('Invalid date provided');
    }

    // Use UTC to avoid timezone issues
    const year = appointmentDate.getUTCFullYear();
    const month = String(appointmentDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(appointmentDate.getUTCDate()).padStart(2, '0');
    const hours = String(appointmentDate.getUTCHours()).padStart(2, '0');
    const minutes = String(appointmentDate.getUTCMinutes()).padStart(2, '0');

    const dateStr = `${year}-${month}-${day}`;
    const startTime = `${hours}:${minutes}:00`;

    // Calculate end time (1 hour session)
    const endHour = (appointmentDate.getUTCHours() + 1) % 24;
    const endTime = `${String(endHour).padStart(2, '0')}:${minutes}:00`;

    console.log('🕐 Time calculations:', {
      originalDateTime: dateTime,
      parsedDate: appointmentDate,
      dateStr,
      startTime,
      endTime,
      utcInfo: {
        year: appointmentDate.getUTCFullYear(),
        month: appointmentDate.getUTCMonth() + 1,
        date: appointmentDate.getUTCDate(),
        hours: appointmentDate.getUTCHours(),
        minutes: appointmentDate.getUTCMinutes(),
      },
    });

    // First, clean up any cancelled appointments for this slot to avoid constraint violations
    await sql`
      DELETE FROM appointments
      WHERE tutor_id = ${tutorId}
        AND appointment_date = ${dateStr}
        AND start_time = ${startTime}
        AND status = 'cancelled'
    `;

    // Check if the slot is still available (only scheduled appointments matter)
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

    // Handle both snake_case and camelCase field names from database
    const appointmentDateField =
      appointment.appointment_date || appointment.appointmentDate;
    const startTimeField = appointment.start_time || appointment.startTime;
    const tutorName = appointment.tutor_name || appointment.tutorName;
    const tutorEmail = appointment.tutor_email || appointment.tutorEmail;
    const createdAt = appointment.created_at || appointment.createdAt;

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        id: appointment.id,
        dateTime:
          appointmentDateField && startTimeField
            ? new Date(
                `${
                  appointmentDateField.toISOString().split('T')[0]
                }T${startTimeField}Z`
              )
            : null,
        status: appointment.status,
        notes: appointment.notes,
        tutor: {
          name: tutorName,
          email: tutorEmail,
          subject: appointment.subject,
        },
        createdAt: createdAt,
      },
    });
  } catch (error) {
    console.error('❌ Error booking appointment:', error);
    console.error('❌ Stack trace:', error.stack);
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
    console.log('🔄 Update appointment request:', {
      id: req.params.id,
      body: req.body,
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
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
      console.log('❌ Appointment not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or cannot be updated',
      });
    }

    const appointment = existingAppointment[0];
    console.log('📋 Existing appointment:', appointment);

    // Handle both snake_case and camelCase field names for tutor_id
    const tutorId = appointment.tutor_id || appointment.tutorId;

    let updateFields = {};

    // If updating the date/time
    if (dateTime) {
      console.log('📅 Updating appointment time to:', dateTime);

      // Ensure we're working with a proper Date object and use UTC consistently
      let appointmentDate;
      if (typeof dateTime === 'string') {
        appointmentDate = new Date(dateTime);
      } else if (dateTime instanceof Date) {
        appointmentDate = dateTime;
      } else {
        throw new Error('Invalid dateTime format');
      }

      // Validate the date
      if (isNaN(appointmentDate.getTime())) {
        throw new Error('Invalid date provided');
      }

      // Use UTC to avoid timezone issues (same as booking function)
      const year = appointmentDate.getUTCFullYear();
      const month = String(appointmentDate.getUTCMonth() + 1).padStart(2, '0');
      const day = String(appointmentDate.getUTCDate()).padStart(2, '0');
      const hours = String(appointmentDate.getUTCHours()).padStart(2, '0');
      const minutes = String(appointmentDate.getUTCMinutes()).padStart(2, '0');

      const dateStr = `${year}-${month}-${day}`;
      const startTime = `${hours}:${minutes}:00`;

      // Calculate end time (1 hour session)
      const endHour = (appointmentDate.getUTCHours() + 1) % 24;
      const endTime = `${String(endHour).padStart(2, '0')}:${minutes}:00`;

      console.log('🕐 Update time calculations:', {
        originalDateTime: dateTime,
        parsedDate: appointmentDate,
        dateStr,
        startTime,
        endTime,
        tutorId: tutorId,
      });

      // First, clean up any cancelled appointments for this new slot to avoid constraint violations
      await sql`
        DELETE FROM appointments
        WHERE tutor_id = ${tutorId}
          AND appointment_date = ${dateStr}
          AND start_time = ${startTime}
          AND status = 'cancelled'
      `;

      // Check if the new slot is available (exclude the current appointment being updated)
      const conflictingAppointment = await sql`
        SELECT id FROM appointments
        WHERE tutor_id = ${tutorId}
          AND appointment_date = ${dateStr}
          AND start_time = ${startTime}
          AND status = 'scheduled'
          AND id != ${id}
      `;

      if (conflictingAppointment.length > 0) {
        console.log('❌ Slot conflict detected:', conflictingAppointment[0]);
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

    console.log('📝 Update fields:', updateFields);

    // Update the appointment
    const updated = await sql`
      UPDATE appointments 
      SET ${sql(updateFields)}
      WHERE id = ${id}
      RETURNING *
    `;

    console.log('✅ Appointment updated in database:', updated[0]);

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
    console.log('📋 Complete updated appointment data:', updatedAppointment);

    // Handle both snake_case and camelCase field names from database
    const appointmentDateField =
      updatedAppointment.appointment_date || updatedAppointment.appointmentDate;
    const startTimeField =
      updatedAppointment.start_time || updatedAppointment.startTime;
    const tutorName =
      updatedAppointment.tutor_name || updatedAppointment.tutorName;
    const tutorEmail =
      updatedAppointment.tutor_email || updatedAppointment.tutorEmail;
    const createdAt =
      updatedAppointment.created_at || updatedAppointment.createdAt;

    const responseData = {
      id: updatedAppointment.id,
      dateTime:
        appointmentDateField && startTimeField
          ? new Date(
              `${
                appointmentDateField instanceof Date
                  ? appointmentDateField.toISOString().split('T')[0]
                  : appointmentDateField
              }T${startTimeField}Z`
            )
          : null,
      status: updatedAppointment.status,
      notes: updatedAppointment.notes,
      tutor: {
        name: tutorName,
        email: tutorEmail,
        subject: updatedAppointment.subject,
      },
      createdAt: createdAt,
    };

    console.log('📤 Sending response:', responseData);

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: responseData,
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

// Temporary cleanup function to remove corrupted appointments
export const cleanupAppointments = async (req, res) => {
  try {
    console.log('🧹 Starting cleanup of corrupted appointments...');

    // Delete appointments with null appointment_date or start_time
    const deletedAppointments = await sql`
      DELETE FROM appointments 
      WHERE appointment_date IS NULL 
        OR start_time IS NULL
      RETURNING id, appointment_date, start_time
    `;

    console.log('🗑️ Deleted appointments:', deletedAppointments);

    res.json({
      success: true,
      message: `Cleaned up ${deletedAppointments.length} corrupted appointments`,
      deletedAppointments,
    });
  } catch (error) {
    console.error('❌ Error cleaning up appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup appointments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
