const mongoose = require('mongoose');

const workerSchema = new mongoose.Schema({
  empid:{
    type: String,
    unique: true,
    required: true,
},
  
  username: String,
 
  email: { type: String, unique: true },
  password: String, // Hash and salt passwords
  phone: String,
  address: String,
  profession: String, // e.g., plumber, beautician
  // Other relevant fields
});

const Worker = mongoose.model('Worker', workerSchema);

module.exports = Worker;
