const express = require('express');
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config()
app.use(express.json());
const cors = require("cors");
const Chat = require('./models/Chat');

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
    socket.on("message", async (data) => {
        console.log("message", data)
        const { room_id, newMessage } = data;
        try {
            // Find the chat room corresponding to the room_id
            let chat = await Chat.findById(room_id);

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


console.log(process.env.url)
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to the database');
});

http.listen(3007, () => {
    console.log('Server started on port 3007');
}
);
