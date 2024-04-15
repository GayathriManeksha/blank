const express = require('express');
const jwt = require('jsonwebtoken');
const Worker = require('../models/worker');
const Request = require('../models/request');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Bid = require('../models/bid');
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
        const { workerId, location, address } = req.body;
        console.log({ workerId, location, address });

        const user = await Worker.findById(workerId);
        console.log(user)
        if (!user) {
            return res.status(404).json({ error: 'Worker not found' });
        }

        // Update the request status to 'assigned'
        user.location = location;
        user.address=address;
        await user.save();
        return res.status(200).json({ message: "saved location" })
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

router.post('/chat', async (req, res) => {
    try {
        const { userId, workerId } = req.body;

        // Check if a chat room already exists for the given userId and workerId
        let chat = await Chat.findOne({ userId, workerId });
        // console.log(chat)
        // If a chat room doesn't exist, create a new one
        if (!chat) {
            chat = new Chat({ userId, workerId, messages: [] });
            await chat.save();
        }

        res.json({ chatId: chat._id, messages: chat.messages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/chats/users', async (req, res) => {
    try {
        const { workerId } = req.body;
        console.log("worker", req.body)

        // Find all chat rooms associated with the specified worker ID
        const chats = await Chat.find({ workerId });

        // Extract unique user IDs from the found chat rooms
        const userIds = chats.reduce((acc, chat) => {
            if (!acc.includes(chat.userId.toString())) {
                acc.push(chat.userId.toString());
            }
            return acc;
        }, []);

        // Lookup user details for each user ID
        const usersWithDetails = await Promise.all(userIds.map(async (userId) => {
            const user = await User.findById(userId);
            return { id: userId, username: user ? user.username : 'Unknown' }; // Assuming username is the user's name field
        }));
        // Extract user IDs from the requests
        const users = await User.find({ _id: { $in: userIds } });
        res.status(200).json({ users });
        // res.json({ users: usersWithDetails });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to find if there exists a bid with the given workerId and userId and approval=0
router.post('/bid', async (req, res) => {
    try {
        const { workerId, userId } = req.body;
        console.log({workerId,userId})
        // Find bid with given workerId, userId, and approval=0
        const bid = await Bid.findOne({ workerId, userId, approval: { $in: [0, 1] }});
        console.log(bid)
        // If bid exists, return it
        if (bid) {
            return res.json(bid);
        } else {
            return res.status(404).json({ message: 'Bid not found with the given parameters.' });
        }
    } catch (error) {
        console.error("Error finding bid:", error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});

router.get('/location/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        console.log(userId)
        // Find the user by username
        const user = await Worker.findById(userId)
        // If user not found, return 404 error
        if (!user) {
            console.log('user not found')
            return res.status(404).json({ error: 'User not found' });
        }
        console.log({ location: user.location, address: user.address })
        // Return user's location
        return res.status(200).json({ location: user.location, address: user.address });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});
router.get('/workers/:empid', async (req, res) => {
    const empid = req.params.empid;
  
    try {
      // Find the worker with the provided empid
      const worker = await Worker.findOne({ empid }, '-password'); // Exclude password field from the response
  
      if (!worker) {
        return res.status(404).json({ message: 'Worker not found' });
      }
  
      res.json(worker);
    } catch (error) {
      // If an error occurs, send an error response
      res.status(500).json({ message: error.message });
    }
  });
  
module.exports = router;
