const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const logger = require("morgan");
require("dotenv").config();

const app = express();

const corsOptions = {
    origin: process.env.URL ?? 'http://localhost:5000'
}

app.use(cors(corsOptions));

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

if(process.env.NODE_ENV !== "test") {
	app.use(logger("dev"));
}

const MONGODB_URL = process.env.MONGODB_URL ?? 'mongodb://localhost:27017'

mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
	//don't show the log when it is test
	if(process.env.NODE_ENV !== "test") {
		console.log("Connected to %s", MONGODB_URL);
		console.log("App is running ... \n");
		console.log("Press CTRL + C to stop the process. \n");
	}
}).catch(err => {
    console.error("App starting error:", err.message);
    process.exit(1);
});

const db = mongoose.connection;

app.get("/", (req, res) => {
    res.json({ message: "Server is online." });
});

app.use("/api/", require('./routes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

