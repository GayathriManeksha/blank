const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointments');
const Worker = require('../models/worker');
const Feedback = require('../models/feedback.js');
const Grievance = require('../models/grievance.js');
const User=require('../models/User.js')

async function sendPushNotification(expoPushToken, message) {

    const m = {
        to: expoPushToken,
        sound: 'default',
        title: message.title || 'Test title',
        body: message.body || 'Test body',
        data: message.data || {},
    };

    try {
        const response = await fetch('https://api.expo.dev/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(m),
        });

        if (response.ok) {
            console.log('Notification sent successfully');
        } else {
            console.error('Failed to send notification:', response.status);
        }
    } catch (error) {
        console.error('Error sending notification:', error.message);
    }
}

router.post('/to-worker', async (req, res) => {
    try {
        const { userId,message } = req.body;

        console.log(userId,message)
        // Find the user by username
        const user = await Worker.findById(userId)
        // If user not found, return 404 error
        if (!user) {
            console.log('user not found')
            return res.status(404).json({ error: 'User not found' });
        }
        console.log(user.token)
        sendPushNotification(user.token,message)
        // Return user's location
        return res.status(200).json({message:'success'});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.post('/to-user', async (req, res) => {
    try {
        const { userId, message } = req.body;

        console.log(userId, message)
        // Find the user by username
        const user = await User.findById(userId)
        // If user not found, return 404 error
        if (!user) {
            console.log('user not found')
            return res.status(404).json({ error: 'User not found' });
        }
        console.log(user.token)
        sendPushNotification(user.token,message)
        // Return user's location
        return res.status(200).json({ message: 'success' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;