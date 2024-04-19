const express = require('express');
const router = express.Router();
const Request = require('../models/request');
const Appointment = require('../models/appointments');
const Worker = require('../models/worker');
const Bid = require('../models/bid');
const Chat = require('../models/Chat')

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
    const { date } = req.body
    // Find the bid by ID
    const bid = await Bid.findById(bidId);

    if (!bid) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Update the request status to 'assigned'
    bid.approval = 1;
    await bid.save();

    //also write code for duplicate appointments

    // Create an appointment with the user and worker IDs
    const appointment = new Appointment({
      user: bid.userId,
      worker: bid.workerId,
      date,
      amount: bid.amount,
      status: 'active',
    });
    await appointment.save();

    // Delete bid messages from the Chat schema
    const chat = await Chat.findOne({ userId: bid.userId, workerId: bid.workerId });

    if (chat) {
      // Filter out bid messages
      chat.messages = chat.messages.filter(message => {
        return !(message.contentType === 'bid');
      });

      // Save the updated chat document
      await chat.save();
    }

    res.status(200).json({ message: 'Request accepted and appointment created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/worker-history/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;

    // Find appointments where the worker is involved, populate the user details (e.g., username and email)
    const appointments = await Appointment.find({ worker: workerId })
      .populate({
        path: 'user',
        select: 'username email', // Include only the user's username and email
      });

    res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/user-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log({ userId })
    // Find appointments where the user is involved, populate the worker details (e.g., username, email, and profession)
    const appointments = await Appointment.find({ user: userId })
      .populate({
        path: 'worker',
        select: 'username email profession', // Include the worker's username, email, and profession
      });

    res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/progress/:workerId', async (req, res) => {
  const { workerId } = req.params;

  try {
    // Find and update one appointment where worker ID matches and status is 'active'
    const result = await Appointment.updateOne(
      { worker: workerId, status: 'active' },
      { $set: { status: 'progress' } }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: 'Appointment status updated to progress' });
    } else {
      res.status(404).json({ message: 'No appointments found in active status for the given workerId' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.put('/completed/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Find and update one appointment where user ID matches and status is 'progress'
    const result = await Appointment.updateOne(
      { user: userId, status: 'progress' },
      { $set: { status: 'completed' } }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: 'Appointment status updated to completed' });
    } else {
      res.status(404).json({ message: 'No appointments found in progress status for the given userId' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.put('/appointment/paid/:workerId', async (req, res) => {
  const { workerId } = req.params;

  try {
    // Find and update one appointment where worker ID matches and status is 'completed'
    const appointment = await Appointment.findOne(
      { worker: workerId, status: 'completed' }
    );

    // Check if an appointment was found
    if (appointment) {
      const appointmentUpdateResult = await Appointment.updateOne(
        { worker: workerId, status: 'completed' },
        { $set: { status: 'paid' } }
      );

      // If the appointment status was successfully updated
      if (appointmentUpdateResult.modifiedCount > 0) {
        const userId = appointment.user; // Get userId from the appointment

        // Update bid where workerId matches and approval is >= 0, and userId matches the appointment's userId
        const bidUpdateResult = await Bid.updateOne(
          { workerId, userId, approval: 1 },
          { $set: { approval: -1 } }
        );

        // Return success response
        res.status(200).json({
          message: 'Appointment status updated to paid and bid approval value set to -1',
          bidUpdateCount: bidUpdateResult.modifiedCount, // Optional: Include the count of bids updated
        });
      } else {
        res.status(404).json({ message: 'No appointments found in completed status for the given workerId' });
      }
    } else {
      res.status(404).json({ message: 'No appointments found in completed status for the given workerId' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.get('/active-worker-history/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;

    // Find appointments where the worker is involved, populate the user details (e.g., username and email)
    const appointments = await Appointment.find({ worker: workerId, status: { $ne: 'paid' } })
      .populate({
        path: 'user',
        select: 'username email', // Include only the user's username and email
      });

    res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/active-user-history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log({ userId })
    // Find appointments where the user is involved, populate the worker details (e.g., username, email, and profession)
    const appointments = await Appointment.find({ user: userId, status: { $ne: 'paid' } })
      .populate({
        path: 'worker',
        select: 'username email profession', // Include the worker's username, email, and profession
      });

    res.status(200).json(appointments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/status/:appointmentId', async (req, res) => {
  const { appointmentId } = req.params;

  try {
    // Find the appointment with the given ID
    const appointment = await Appointment.findById(appointmentId);

    // Check if the appointment exists
    if (appointment) {
      // Return the current status of the appointment
      res.status(200).json({ status: appointment.status });
    } else {
      // If no appointment is found, return an error message
      res.status(404).json({ message: 'Appointment not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
