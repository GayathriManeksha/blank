const express = require('express');
const jwt = require('jsonwebtoken');
const Worker = require('../models/worker');
const Request = require('../models/request');
const User = require('../models/User');
const router = express.Router();

const calculateDistance = (userLocation, workerLocation) => {
    const earthRadius = 6371; // Earth radius in kilometers
    const { latitude: userLat, longitude: userLng } = userLocation;
    const { latitude: workerLat, longitude: workerLng } = workerLocation;

    const dLat = toRadians(workerLat - userLat);
    const dLng = toRadians(workerLng - userLng);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(userLat)) * Math.cos(toRadians(workerLat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = earthRadius * c; // Distance in kilometers

    return distance;
};

const toRadians = (angle) => {
    return (angle * Math.PI) / 180;
};

router.post('/login', async (req, res) => {
    try {
        const { empid, password } = req.body;

        // Find the user by username
        const user = await Worker.findOne({ empid });
        console.log(user)
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
        const requests = await Request.find({ workerId, status: 'Pending' });

        // Extract user IDs from the requests
        console.log('Requests:', requests);
        const userIds = requests.map(request => request.userId);
        const users = await User.find({ _id: { $in: userIds } });
        res.status(200).json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/workers/:profession/:location', async (req, res) => {
    try {
        const { profession, location } = req.params;
        // Fetch all workers from the Worker model
        const workers = await Worker.find({ profession, address: { $regex: new RegExp(location, 'i') } });
        console.log(workers);
        // Send the list of workers as a JSON response
        res.status(200).json(workers);
    } catch (error) {
        console.error(error);
        // If an error occurs, send a 500 Internal Server Error response
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/listworkers', async (req, res) => {
    try {
        const { profession, userId } = req.body;

        // Fetch the user's location
        const user = await User.findOne({ username: userId });
        if (!user) { return res.status(401).json({ error: 'No such user' }); }
        const userLocation = user.location;

        // Fetch all workers from the Worker model
        const workers = await Worker.find({ profession });

        // Calculate distance for each worker and add it to the worker object
        const workersWithDistance = workers.map((worker) => {
            const distance = calculateDistance(userLocation, worker.location);
            return { ...worker.toObject(), distance }; // Adding distance to the worker object
        });

        // Sort workers by distance (ascending order)
        workersWithDistance.sort((a, b) => a.distance - b.distance);

        // Take the top 5 workers
        const best5Workers = workersWithDistance.slice(0, 5);

        res.status(200).json(best5Workers);
    } catch (error) {
        console.error(error);
        // If an error occurs, send a 500 Internal Server Error response
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/savelocation', async (req, res) => {
    try {
        console.log("save-location");
        const { workerId, location } = req.body;
        console.log({ workerId, location });

        const user = await Worker.findById(workerId);
        console.log(user)
        if (!user) {
            return res.status(404).json({ error: 'Worker not found' });
        }

        // Update the request status to 'assigned'
        user.location = location;
        await user.save();
        return res.status(200).json({ message: "saved location" })
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

module.exports = router;
