

const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  empid: {
    type: String,
    unique: true,
    required: true,
  },
  username: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  address: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  profession: String,
  // Other relevant fields
});

const Worker = mongoose.model('Worker', workerSchema);

module.exports = Worker;
