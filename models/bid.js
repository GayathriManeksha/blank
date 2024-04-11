const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    amount: { type: Number }, // For bid messages
    timestamp: { type: String, default: Date.now },
    chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true }, // Reference to the user making the request
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user making the request
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' }, // Reference to the assigned worker
    approval: { type: Number, default: 0 },
    sender: {
        role: { type: String, enum: ['user', 'worker'], required: true }
    },
});

const bid = mongoose.model('Bid', bidSchema);

module.exports = bid;
