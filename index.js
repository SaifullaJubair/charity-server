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

    app.post("/users", async (req, res) => {
      try {
        const { name, email, password } = req.body;
        // Check if the user already exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
          return res.json({ error: "User already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create New User
        const newUser = {
          name,
          email,
          password: hashedPassword,
          role: "user",
        };
        const result = await usersCollection.insertOne(newUser);
        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
      }
    });
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
