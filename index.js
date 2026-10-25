import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import 'dotenv/config' // for esm
import cors from 'cors'

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

app.get('/', (req, res) => {
    res.send({message: "Hello, Server is running..."});
})

//Create API for getting all data from mongoDB databse
app.get('/destinations', async (req, res) => {
  const result = await destinationCollection.find().toArray();
  res.send(result);
})

//Create API for getting single data from mongoDB database
app.get(`/destinations/:id`, async (req, res) => {
  const id = req.params.id;
  const query = {_id: new ObjectId(id)};
  const result = await destinationCollection.findOne(query);
  res.send(result);
})

//Create API for Posting data to mongoDB database
app.post('/destinations', async (req, res) => {
    const data = req.body;
    const result = await destinationCollection.insertOne(data);
    console.log(result);
    res.send(result);
    
})


app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});