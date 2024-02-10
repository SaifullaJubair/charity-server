require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

const cors = require("cors");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5u9qcxt.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const run = async () => {
  try {
    //---------All collection Start here---------
    const DB = client.db("charity");
    const usersCollection = DB.collection("users");
    const causeCollection = DB.collection("causes");
    const donationCollection = DB.collection("donations");
    // ---------All collection End here----------
    // USER API START
    // Get All Users
    app.get("/users", async (req, res) => {
      const result = await usersCollection
        .find({})
        .sort({ date: -1 })
        .toArray();
      res.send(result);
    });

    // Get Single User login
    app.post("/login", async (req, res) => {
      try {
        const { email, password } = req.body;
        const user = await usersCollection.findOne({ email });
        // Check if the user exists
        if (!user) {
          return res.status(401).json({ error: "Invalid email or password" });
        }
        // Check if the password is correct
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ error: "Invalid email or password" });
        }
        const token = jwt.sign(
          { _id: user._id, email: user.email },
          process.env.JWT_SECRET,
          {
            expiresIn: "30d",
          }
        );

        res.status(200).json({ message: "Login successful", token });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Create User
    app.post("/signup", async (req, res) => {
      try {
        // date format
        const currentDate = new Date();
        const formattedDate = new Intl.DateTimeFormat("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(currentDate);

        const { name, email, password } = req.body;
        if (!name || !email || !password) {
          return res.status(400).json({ error: "All fields are required" });
        }
        // Check if the user already exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
          return res.json({ error: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        // validate
        // Create New User
        const newUser = {
          name,
          email,
          password: hashedPassword,
          role: "user",
          date: formattedDate,
        };
        const result = await usersCollection.insertOne(newUser);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // USER API END

    //------ CAUSE API START ---------
    // Get All Causes

    app.get("/causes", async (req, res) => {
      try {
        const result = await causeCollection
          .find({})
          .sort({ date: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
    // Get Single Cause

    app.get("/causes/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await causeCollection.findOne(query);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Create Cause

    app.post("/causes", async (req, res) => {
      try {
        const cause = req.body;
        const result = await causeCollection.insertOne(cause);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Update Cause

    app.put("/causes/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const cause = req.body;
        const filter = { _id: new ObjectId(id) };
        const options = { upsert: true };
        const updateDoc = {
          $set: cause,
        };
        const result = await causeCollection.updateOne(
          filter,
          updateDoc,
          options
        );
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // Delete Cause

    app.delete("/causes/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await causeCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    //------ CAUSE API END ---------

    app.get("/donations", async (req, res) => {
      try {
        const result = await donationCollection
          .find({})
          .sort({ date: -1 })
          .toArray();
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.post("/donations", async (req, res) => {
      try {
        const currentDate = new Date();
        const formattedDate = new Intl.DateTimeFormat("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }).format(currentDate);
        const donation = req.body;
        const result = await donationCollection.insertOne({
          ...donation,
          date: formattedDate,
        });
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    //---------All API End here---------
  } finally {
  }
};

run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Charity Server!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
