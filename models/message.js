const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    role: { type: String, enum: ['user', 'worker'], required: true },
    userOrWorker: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'sender.role' },
  },
  receiver: {
    role: { type: String, enum: ['user', 'worker'], required: true },
    userOrWorker: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'receiver.role' },
  },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  // Other relevant fields
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
