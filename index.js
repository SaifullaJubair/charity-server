require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

const cors = require("cors");

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5u9qcxt.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

const run = async () => {
  try {
    //---------All collection Start here---------
    const DB = client.db("charity");
    const usersCollection = DB.collection("users");
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
    // Create User
    app.post("/users", async (req, res) => {
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

    // USER API START
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
