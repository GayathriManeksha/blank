const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    id:String,
    sender: {
        role: { type: String, enum: ['user', 'worker'], required: true }
    },
    contentType: { type: String, enum: ['text', 'bid'], required: true },
    content: {
        text: { type: String }, // For text messages
        bidAmount: { type: Number }, // For bid messages
    },
    timestamp: { type: String, default: Date.now },
    // Other relevant fields
});

const chatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user making the request
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }, // Reference to the assigned worker
    messages: [messageSchema]
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
