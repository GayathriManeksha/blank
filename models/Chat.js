const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        role: { type: String, enum: ['user', 'worker'], required: true },
        // userOrWorker: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'sender.role' },
    },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    // Other relevant fields
});

const chatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user making the request
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }, // Reference to the assigned worker
    messages: [messageSchema]
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
