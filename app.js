const express = require('express');
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config()
app.use(express.json());
const cors = require("cors");

app.use(cors());
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

app.use("/user",AuthRouter);
app.use("/emp", WorkRouter);
app.use("/request", RequestRouter);
app.use("/appointment", AppointmentRouter);



console.log(process.env.url)
mongoose.connect(process.env.MONGODB_URI);
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to the database');
});

app.listen(3007, () => {
    console.log('Server started on port 3007');
}
);
