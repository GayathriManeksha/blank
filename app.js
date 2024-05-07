const express = require('express');
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config()
app.use(express.json());
const cors = require("cors");
const Chat = require('./models/Chat');
const Bid = require('./models/bid');

app.use(cors());
app.use(express.urlencoded({ extended: true }));
//👇🏻 New imports
const http = require("http").Server(app);

const socketIO = require('socket.io')(http);

//👇🏻 Add this before the app.get() block
socketIO.on('connection', (socket) => {
    console.log(`⚡: ${socket.id} user just connected!`);

    socket.on("createRoom", (roomName) => {
        console.log("createRoom request", roomName)
        socket.join(roomName);
        const newMessage = {
            text: "Hey"
        };
        // socket.emit("room",newMessage)

        // socket.to(roomName).emit("roomMessage", newMessage); //only those clients joined in this room receives this message maybe
    });
    socket.on("user_online", async (room_id) => {
        console.log("----------------------User Online----------------------")
        try {
            // Update chat document to indicate that the user is online
            await Chat.findByIdAndUpdate(room_id, { userOnline: true });

            console.log("User marked as online in chat:", room_id);
        } catch (error) {
            console.error("Error updating chat document:", error);
        }
    })
    socket.on("user_offline", async (room_id) => {
        console.log("------------------User Offline--------------------",room_id)
        try {
            // Update chat document to indicate that the user is online
            await Chat.findByIdAndUpdate(room_id, { userOnline: false });

            console.log("User marked as offline in chat:", room_id);
        } catch (error) {
            console.error("Error updating chat document:", error);
        }
    })

    socket.on("worker_online", async (room_id) => {
        console.log("----------------------WorkerOnline----------------------")
        try {
            // Update chat document to indicate that the user is online
            await Chat.findByIdAndUpdate(room_id, { workerOnline: true });

            console.log("worker marked as online in chat:", room_id);
        } catch (error) {
            console.error("Error updating chat document:", error);
        }
    })
    socket.on("worker_offline", async (room_id) => {
        console.log("------------------WOrker Offline--------------------", room_id)
        try {
            // Update chat document to indicate that the user is online
            await Chat.findByIdAndUpdate(room_id, { workerOnline: false });

            console.log("worker marked as offline in chat:", room_id);
        } catch (error) {
            console.error("Error updating chat document:", error);
        }
    })

    socket.on("message", async (data) => {
        console.log("message", data)
        const { room_id, newMessage } = data;
        socket.to(room_id).emit("newMessage", newMessage)
        try {
            // Find the chat room corresponding to the room_id
            let chat = await Chat.findById(room_id).populate('userId').populate('workerId');

            // If the chat room doesn't exist, you may handle this case based on your application logic.
            if (!chat) {
                console.log("Chat room not found");
                return;
            }

            // Append the new message to the messages array
            chat.messages.push(newMessage);

            // Save the updated chat room
            await chat.save();

            console.log("Message saved in chat room:", newMessage);

            const message = {
                title: 'New Message',
                body: newMessage.content.text,
                data: { testData: 'test data' },
            };

            if (newMessage.sender.role === 'worker') {

                const user = chat.userId;
                console.log(user)
                // Check if the user exists and has an Expo token
                if (user && user.token && !chat.userOnline) {
                    // Send push notification using the Expo token
                    sendPushNotification(user.token, message);
                } else {
                    console.log("User not found or Expo token not available or user online");
                }
            }
            if (newMessage.sender.role === 'user') {

                const user = chat.workerId;
                // Check if the user exists and has an Expo token
                if (user && user.token && !chat.workerOnline) {
                    // Send push notification using the Expo token
                    sendPushNotification(user.token, message);
                } else {
                    console.log("Worker not found or Expo token not available or online");
                }
            }

        } catch (error) {
            console.error("Error saving message:", error);
        }
    })

    socket.on("accept", async (data) => {
        console.log("accept", data)
        const { room_id, BidData } = data; //pass workerId and userId also from frontend through BidData
        // socket.to(room_id).emit("accepted", BidData)
        try {
            console.log("New Bid Created", BidData);

            let bid = await Bid.findOne({ userId: BidData.userId, workerId: BidData.workerId, approval: 0 });
            console.log("bid", bid);
            //if cancelled set approval -1
            //if request created approval 1
            // If a bid doesn't exist, create a new one
            if (!bid) {
                bid = new Bid(BidData);
                await bid.save();
                console.log("bid", bid);
                socket.to(room_id).emit("accepted", bid)
            }
            socketIO.to(room_id).emit("accepted", bid)
        } catch (error) {
            console.error("Error saving message:", error);
        }
    })

    socket.on('disconnect', () => {
        socket.disconnect()
        console.log('🔥: A user disconnected');
    });
});

setInterval(() => {
    socketIO.sockets.emit('time-msg', { time: new Date().toISOString() });
}, 1000);

//since import is used add .js extension as well
const AuthRouter = require('./routes/user');
const WorkRouter = require('./routes/emp');
const AppointmentRouter = require('./routes/appointment');
const RequestRouter = require('./routes/request');
const FeedbackRouter = require('./routes/feedback');
const NotificationRouter = require('./routes/notification');

async function sendPushNotification(expoPushToken, message) {
    const m = {
        to: expoPushToken,
        sound: 'default',
        title: message.title || 'Test title',
        body: message.body || 'Test body',
        data: message.data || {},
    };
    console.log(m)
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
            console.error('Failed to send notification:', response);
        }
    } catch (error) {
        console.error('Error sending notification:', error.message);
    }
}

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        console.log(token)
        const decoded = jwt.verify(token.split(' ')[1], 'your-secret-key');
        console.log(decoded)
        req.userid = decoded.userId; // Attach the user data from the token to the request object
        next(); // Proceed to the next middleware
    } catch (error) {
        return res.status(400).json({ error: 'Invalid token.' });
    }
};

app.use("/user", AuthRouter);
app.use("/emp", WorkRouter);
app.use("/request", RequestRouter);
app.use("/appointment", AppointmentRouter);
app.use("/feedback", FeedbackRouter);
app.use("/notification", NotificationRouter);


console.log(process.env.url)
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to the database');
});

http.listen(3007, () => {
    console.log('Server started on port 3007');
}
);
