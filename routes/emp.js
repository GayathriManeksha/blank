const express = require('express');
const jwt = require('jsonwebtoken');
const Worker = require('../models/worker');
const Request = require('../models/request');
const router = express.Router();

router.post('/login', async (req, res) => {
    try {
        const { empid, password } = req.body;

        // Find the user by username
        const user = await Worker.findOne({ empid });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare the provided password with the stored password (no hashing)
        if (password !== user.password) {
            return res.status(401).json({ error: 'Password mismatch' });
        }

        // Generate a JWT token
        const token = jwt.sign({ userId: user._id, username: user.username }, 'your_secret_key', { expiresIn: '1h' });

        res.status(200).json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Route to get the list of user IDs for a specific worker
router.get('/requests/:workerId', async (req, res) => {
    try {
        const workerId = req.params.workerId;
        // const workerId = '656c985735a6de4ab5426784';

        // Find all requests with the given workerId
        const requests = await Request.find({ workerId , status : 'Pending'});

        // Extract user IDs from the requests
        console.log('Requests:', requests);
        const userIds = requests.map(request => request.userId);

        res.status(200).json({ userIds });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/workers/:profession/:location', async (req, res) => {
    try {
        const { profession,location } = req.params;
      // Fetch all workers from the Worker model
      const workers = await Worker.find({ profession,address:{ $regex: new RegExp(location, 'i') } });
        console.log(workers);
      // Send the list of workers as a JSON response
      res.status(200).json(workers);
    } catch (error) {
      console.error(error);
      // If an error occurs, send a 500 Internal Server Error response
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

module.exports = router;
