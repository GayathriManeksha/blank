const mongoose = require('mongoose');

// Feedback Schema
const grievanceSchema = new mongoose.Schema({
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  description: String,
  
  // Other feedback fields
});

const Grievance = mongoose.model('Grievance', grievanceSchema);

module.exports = Grievance;
