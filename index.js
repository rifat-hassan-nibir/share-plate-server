const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const requestedFoodsCollection = client.db("sharePlate").collection("requestedFoods");

    // Get all the available foods data form db in available foods page
    app.get("/foods", async (req, res) => {
      let query = {};
      // Get the food data with status "Available"
      if (req.query?.status === "Available") {
        query = { food_status: req.query.status };
      }

      // Get the available foods data sorted by food quantity
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

    // Get a single food data by id
    app.get("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.findOne(query);
      res.send(result);
    });

    // Get all food data under an email
    app.get("/foods/my-foods/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { "donator_details.email": email };
      const result = await foodsCollection.find(query).toArray();
      console.log(result);
      res.send(result);
    });

    // Add new food data to db
    app.post("/foods", async (req, res) => {
      const addedFood = req.body;
      const result = await foodsCollection.insertOne(addedFood);
      res.send(result);
    });

    // Add new requested food data to requested food collection
    app.post("/requested-foods", async (req, res) => {
      const foodData = req.body;
      const result = await requestedFoodsCollection.insertOne(foodData);

      // Update the food_status of the requested food
      const filter = { _id: new ObjectId(foodData.food_id) };
      const updateDoc = {
        $set: {
          food_status: foodData.food_status,
        },
      };
      const updatedFoodStatus = await foodsCollection.updateOne(filter, updateDoc);
      console.log(updatedFoodStatus);

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
