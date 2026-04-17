# Local_Lens

This project connects to MongoDB Atlas.

## Setup

1. Install dependencies: `npm install`
2. Start the local server: `npm start`
3. Open `http://localhost:3000` in your browser.
4. To create a user collection: `npm run create-collection` or `node createUserCollection.js`

Note: Ensure your local MongoDB instance is running on `mongodb://localhost:27017`. Update the database name in `createUserCollection.js` if needed (currently set to "test").
