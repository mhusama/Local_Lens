import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const users = [
  {
    "name": "Arafat Rahman",
    "email": "arafat.rahman@email.com",
    "password": "hashed_password",
    "phone": "01812345678"
  },
  {
    "name": "Nusrat Jahan",
    "email": "nusrat.jahan@email.com",
    "password": "hashed_password",
    "phone": "01923456789"
  },
  {
    "name": "Sabbir Ahmed",
    "email": "sabbir.ahmed@email.com",
    "password": "hashed_password",
    "phone": "01634567890"
  },
  {
    "name": "Farhana Islam",
    "email": "farhana.islam@email.com",
    "password": "hashed_password",
    "phone": "01545678901"
  },
  {
    "name": "Tanvir Hasan",
    "email": "tanvir.hasan@email.com",
    "password": "hashed_password",
    "phone": "01756789012"
  }
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    await User.insertMany(users);
    console.log("Users inserted successfully");

    mongoose.connection.close();
  } catch (error) {
    console.error("Error seeding users:", error);
    mongoose.connection.close();
  }
};

seedUsers();