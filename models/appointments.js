const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  date: Date,
  status: { type: String, default: 'Pending' }, // Pending, Confirmed, Completed, etc.
  // Other relevant fields
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
