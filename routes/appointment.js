const express = require('express');
const router = express.Router();
const Request = require('../models/request');
const Appointment = require('../models/appointments');
const Worker = require('../models/worker');
const Bid=require('../models/bid');

// Route to accept a request and update the appointment and request status
router.put('/accept-request/:requestId', async (req, res) => {
    try {
        const requestId = req.params.requestId;

        // Find the request by ID
        const request = await Request.findById(requestId);

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        // Update the request status to 'assigned'
        request.status = 'assigned';
        await request.save();

        // Create an appointment with the user and worker IDs
        const appointment = new Appointment({
            user: request.userId,
            worker: request.workerId,
            date: new Date(), // You may need to adjust this based on your application logic
            status: 'Pending', // You can set the initial status to 'Pending' or any other appropriate value
        });
        await appointment.save();

        res.status(200).json({ message: 'Request accepted and appointment created' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/accept-request/:bidId', async (req, res) => {
  try {
    const bidId = req.params.bidId;
    const {date} = req.body
    // Find the bid by ID
    const bid = await Bid.findById(bidId);

    if (!bid) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Update the request status to 'assigned'
    bid.approval = 1;
    await bid.save();

    // Create an appointment with the user and worker IDs
    const appointment = new Appointment({
      user: bid.userId,
      worker: bid.workerId,
      date, 
      amount:bid.amount,
      status: 'active', 
    });
    await appointment.save();

    res.status(200).json({ message: 'Request accepted and appointment created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/appointments-history/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;

    // Find the worker by workerId
    const worker = await Worker.findById(workerId);

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Find appointments where the worker is involved, populate only user's username and amount
    const appointments = await Appointment.find({ worker: worker._id })
      .populate('user', 'username') // Populate only 'username' from the user field
      .select('user amount') // Select additional fields from the Appointment model
      .exec();

    res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
