const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

// middleware
const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://share-plate-38a2e.web.app",
    "https://share-plate-38a2e.firebaseapp.com",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.okheupy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const foodsCollection = client.db("sharePlate").collection("foods");

    // Get all foods data form db sorted by quantity
    app.get("/foods", async (req, res) => {
      let query = {};
      if (req.query?.status === "Available") {
        query = { food_status: req.query.status };
      }
      let sort = {};
      if (req.query?.sort === "descending") {
        sort = { food_quantity: -1 };
      }
      let limit = 0;
      if (req.query?.limit) {
        limit = parseInt(req.query.limit);
      }

      const result = await foodsCollection.find(query).sort(sort).limit(limit).toArray();
      res.send(result);
    });

    // Add new food data to db
    app.post("/foods", async (req, res) => {
      const addedFood = req.body;
      const result = await foodsCollection.insertOne(addedFood);
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
