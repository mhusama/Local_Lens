const { MongoClient } = require('mongodb');

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function displayUsers() {
  try {
    await client.connect();
    const db = client.db("localLensDB");
    const users = await db.collection("users").find({}).toArray();
    console.log("Users:", users);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
  }
}

displayUsers();