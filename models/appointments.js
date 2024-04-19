
const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  date: Date,
  amount: { type: Number, default: 250 }, // Set a default value for amount
  status: { type: String, enum: ['active', 'progress','completed','cancelled','paid'],default:'active'}
  // Other relevant fields
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
