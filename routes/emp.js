const express = require('express');
const jwt = require('jsonwebtoken');
const Worker = require('../models/worker');
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

module.exports = router;
