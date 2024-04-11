// routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Worker = require('../models/worker');
const Bid = require('../models/bid');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, password, email, phone, address } = req.body;

    // Check if the username is already taken
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = await User.create({ username, password: hashedPassword, email, phone, address });

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.post('/login', async (req, res) => {
  console.log("here")
  try {
    const { username, password } = req.body;

    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare the provided password with the stored hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id, username: user.username }, 'your_secret_key', { expiresIn: '1h' });

    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/savelocation', async (req, res) => {
  try {
    console.log("save-location");
    const { userId, location, address } = req.body;
    console.log({ userId, location, address });
    const user = await User.findOne({ username: userId });
    console.log(user)
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update the request status to 'assigned'
    user.location = location;
    user.address = address;

    await user.save();
    return res.status(200).json({ message: "saved location" })
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
})

router.get('/location/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(userId)
    // Find the user by username
    const user = await User.findById(userId)
    // If user not found, return 404 error
    if (!user) {
      console.log('user not found')
      return res.status(404).json({ error: 'User not found' });
    }
    console.log({ location: user.location, address: user.address })
    // Return user's location
    return res.status(200).json({ location: user.location , address:user.address});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/chat', async (req, res) => {
  try {
    const { userId, workerId } = req.body;

    // Check if a chat room already exists for the given userId and workerId
    let chat = await Chat.findOne({ userId, workerId });

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

// API endpoint to add a message to a chat room
router.post('/chat/message', async (req, res) => {
  try {
    const { userId, workerId, content } = req.body;

    // Find the chat room based on userId and workerId
    let chat = await Chat.findOne({ userId, workerId }).populate('workerId', 'username');

    // If chat room not found, return an error
    if (!chat) {
      return res.status(404).json({ error: 'Chat room not found' });
    }

    // Add the new message to the chat room
    chat.messages.push({ sender: { role: 'user' }, content });
    await chat.save();

    res.json({ chatId: chat._id, workerName: chat.workerId.username, messages: chat.messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/chat/workers', async (req, res) => {
  try {
    const { userId } = req.body;

    // Find all chat rooms where the provided userId exists
    const chats = await Chat.find({ userId });

    // Extract unique workerIds from the found chat rooms
    const workerIds = chats.reduce((acc, chat) => {
      if (chat.workerId && !acc.includes(chat.workerId.toString())) {
        acc.push(chat.workerId.toString());
      }
      return acc;
    }, []);

    // Lookup worker names for each worker ID
    const workersWithNames = await Promise.all(workerIds.map(async (workerId) => {
      const worker = await Worker.findById(workerId);
      return { id: workerId, name: worker ? worker.username : 'Unknown' }; // Assuming username is the worker's name field
    }));

    res.json({ workers: workersWithNames });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to find if there exists a bid with the given workerId and userId and approval=0
router.post('/bid', async (req, res) => {
  try {
    const { workerId, userId } = req.body;

    // Find bid with given workerId, userId, and approval=0
    const bid = await Bid.findOne({ workerId, userId, approval: 0 });

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

module.exports = router;
