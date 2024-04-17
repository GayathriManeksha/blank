const mongoose = require('mongoose');

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  description: String,
  rating: { type: Number, required: true },
  // Other feedback fields
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
