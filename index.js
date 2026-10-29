import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config' // for esm
import cors from 'cors'
import { createRemoteJWKSet, jwtVerify } from 'jose';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(`mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@ac-n9vqlya-shard-00-00.d1i0h77.mongodb.net:27017,ac-n9vqlya-shard-00-01.d1i0h77.mongodb.net:27017,ac-n9vqlya-shard-00-02.d1i0h77.mongodb.net:27017/?ssl=true&replicaSet=atlas-7upjpt-shard-0&authSource=admin`);
export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}
// Call this only when your application terminates
export async function disconnectFromMongoDB() {
  await client.close();
}
//Call the function to connect to mongoDB
const mongoClient = await connectToMongoDB();
const db = mongoClient.db("wanderlast");
const destinationCollection = db.collection("destination");
const bookingsCollection = db.collection("bookings");

const verifyUserWithMiddlewareToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("authHeader", authHeader);
  if (!authHeader) {
    return res.status(401).send({ msg: "Unauthorized" });
  }
  console.log("I'm Middleware!!!");

  const token = authHeader.split(" ")[1];
  console.log(token);
  if (!token) {
    return res.status(401).send({ msg: "Unauthorized" });
  }

  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
  )

  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log("PayLoad: ", payload);
    next();
  } catch(error) {
    return res.status(500).send({ msg: "Server Error" }, error);
  }



}

app.get('/', (req, res) => {
  res.send({ message: "Hello, Server is running..." });
})

//Create API for getting all data from mongoDB databse
app.get('/destinations', async (req, res) => {
  const result = await destinationCollection.find().toArray();
  res.send(result);
})
//API for featured-destination on home page 
app.get('/featured-destination', async (req, res) => {
const result = await destinationCollection.find().limit(5).toArray();
res.send(result);
})

//Create API for getting single data from mongoDB database
app.get(`/destinations/:id`, verifyUserWithMiddlewareToken, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await destinationCollection.findOne(query);
  res.send(result);
})

//API for getting bookings data for my-bookings page
app.get('/my-bookings/:email', verifyUserWithMiddlewareToken, async (req, res) => {
  const email = req.params.email;
  const result = await bookingsCollection.find({ email: email }).toArray();
  res.send(result);
  console.log(result);
})

//Create API for Posting data to mongoDB database or add-destination
app.post('/destinations', verifyUserWithMiddlewareToken, async (req, res) => {
  const data = req.body;
  const result = await destinationCollection.insertOne(data);
  console.log(result);
  res.send(result);

})
//Create API for posting booking data to mongoDB
app.post('/bookings', verifyUserWithMiddlewareToken, async (req, res) => {
  const data = req.body;
  const result = await bookingsCollection.insertOne(data);
  console.log("eBookingData: ", result);
  res.send(result);
})

//Create API for update(put, patch) the data in mongoDB database
app.patch('/destinations/:id', verifyUserWithMiddlewareToken, async (req, res) => {
  const { id } = req.params;
  const updatedData = req.body;
  const result = await destinationCollection.updateOne(
    { _id: new ObjectId(id) },
    { $set: updatedData }
  );
  console.log(result);
  res.json(result);
})

//Create API for deleting destination from the database
app.delete('/destinations/:id', verifyUserWithMiddlewareToken, async (req, res) => {
  const { id } = req.params;
  const result = await destinationCollection.deleteOne({ _id: new ObjectId(id) });
  res.send(result);
  console.log(result);
})
//API for deleting mybooking data for my-bookings page
app.delete('/my-bookings/:id', verifyUserWithMiddlewareToken, async (req, res) => {
  const id = req.params.id;
  const result = await bookingsCollection.deleteOne({ _id: id });
  res.send(result);
  console.log(result);
})


app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

export default app