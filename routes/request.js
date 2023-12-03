const express = require('express');
const Request = require('../models/request'); // Import the Request model

const router = express.Router();

// API endpoint to add a request
router.post('/add-request', async (req, res) => {
  try {
    // Extract necessary information from the request body
    const { userId, workerId } = req.body;

    // Create a new request in the Request model
    const newRequest = await Request.create({
      userId: userId,
      workerId: workerId,
      status: 'Pending', // You can set the initial status as 'Pending' or any other appropriate value
    });

    // Send a success response with the created request
    res.status(201).json({ message: 'Request added successfully', request: newRequest });
  } catch (error) {
    console.error(error);
    // If an error occurs, send a 500 Internal Server Error response
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
