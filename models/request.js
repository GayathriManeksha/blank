const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user making the request
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }, // Reference to the assigned worker
   
    status: { type: String, default: 'pending' }, // Status of the request (e.g., pending, approved, completed)
    // Other relevant fields
});

const Request = mongoose.model('Request', requestSchema);

module.exports = Request;
