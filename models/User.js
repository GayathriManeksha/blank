const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  location: {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  // Other relevant fields
});

const User = mongoose.model('User', userSchema);

module.exports = User;
