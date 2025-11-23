import express from "express"
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const app = express();

// Server configuration
const PORT = process.env.PORT ?? 8081;
const HOST = process.env.HOST ?? "0.0.0.0";

// MongoDB configuration
const MONGO_URI = process.env.MONGO_URI;
const DBNAME = process.env.DBNAME;
const COLLECTION = process.env.COLLECTION;

const client = new MongoClient(MONGO_URI);
const db = client.db(DBNAME);

app.use(cors());
app.use(express.json());

app.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}`);
    client.connect().then(() => {
        console.log("Connected to MongoDB");
    }).catch((err) => {
        console.error("Failed to connect to MongoDB", err);
    });
});

app.get("/contacts", async (req, res) => {
    await client.connect();
    console.log("Node connected successfully to GET MongoDB");
    const query = {};
    const results = await db
        .collection(COLLECTION)
        .find(query)
        .limit(100)
        .toArray();
    console.log(results);
    res.status(200).json(results);
});

app.get("/contacts:name", async (req, res) => {
    const contactName = req.params.name;
    console.log("Contact to find :", contactName);
    await client.connect();
    console.log("Node connected successfully to GET-id MongoDB");
    const query = { contact_name: contactName };
    const results = await db.collection(collection)
        .findOne(query);
    console.log("Results :", results);
    if (!results) {
        res.status(404);
        res.send("Not Found");
    } else {
        res.status(200);
        res.json(results);
    }
});

app.post("/contacts", async (req, res) => {
    let new_image_url;

    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).send({ message: 'Bad request: No data provided.' });
        }
        const { contact_name, phone_number, message, image_url } = req.body;
        await client.connect();
        console.log("Node connected successfully to POST MongoDB");
        const contactsCollection = db.collection(collection);
        const existingContact = await contactsCollection.findOne({
            contact_name: contact_name
        });

        if (existingContact) {
            return res.status(409).json({
                message: `Contact with name '${contact_name}' already exists.`,
            });
        }

        if (!image_url.includes("https://robohash.org/")) {
            new_image_url = "https://robohash.org/" + image_url.trim().replaceAll(" ", "");
        }
        else {
            new_image_url = image_url;
        }

        const newContact = {
            contact_name,
            phone_number,
            message,
            image_url: new_image_url
        };
        console.log(newContact);
        const result = await contactsCollection.insertOne(newContact);
        console.log("Document inserted:", result);
        res.status(201);
        res.json({ message: "New contact added successfully" });
    } catch (error) {
        console.error("Error in POST /contacts:", error);
        res.status(500);
        res.json({ message: "Failed to add contact: " + error.message });
    } finally {
        await client.close();
    }
});

app.delete("/contacts:name", async (req, res) => {
    try {
        // Read parameter id
        const name = req.params.name;
        console.log("Contact to delete :", name);
        // Connect to MongoDB
        await client.connect();
        console.log("Node connected successfully to DELETE MongoDB");
        // Reference collection
        const contactsCollection = db.collection(collection);
        // Check if contact already exists
        const existingContact = await contactsCollection.findOne({
            contact_name: name,
        });
        if (!existingContact) {
            return res.status(404).json({
                message: `Contact with name ${name} does NOT exist.`,
            });
        }
        // Define query
        const query = { contact_name: name };
        // Delete one contact
        const results = await db.collection("contacts").deleteOne(query);
        // Response to Client
        res.status(200);
        // res.send(results);
        res.send({ message: `Contact ${name} was DELETED successfully.` });
    }
    catch (error) {
        console.error("Error deleting robot:", error);
        res.status(500).send({ message: 'Internal Server Error' + error });
    }
});

app.put("/contacts:name", async (req, res) => {
    let new_image_url;

    try {
        const name = req.params.name;
        console.log("Contact to update :", name);
        const { contact_name, phone_number, message, image_url } = req.body;
        await client.connect();
        console.log("Node connected successfully to PUT MongoDB");
        const contactsCollection = db.collection(collection);
        const existingContact = await contactsCollection.findOne({
            contact_name: name,
        });
        if (!existingContact) {
            return res.status(404).json({
                message: `Contact with name ${name} does NOT exist.`,
            });
        }

        if (!image_url.includes("https://robohash.org/")) {
            new_image_url = "https://robohash.org/" + image_url.trim().replaceAll(" ", "");
        }
        else {
            new_image_url = image_url;
        }

        const updatedContact = {
            contact_name,
            phone_number,
            message,
            image_url: new_image_url
        };
        console.log("Updated Contact :", updatedContact);
        const result = await contactsCollection.updateOne(
            { contact_name: name },
            { $set: updatedContact },
        );
        console.log("Document updated:", result);
        res.status(200);
        res.json({ message: `Contact ${name} was UPDATED successfully.` });
    } catch (error) {
        console.error("Error in PUT /contacts/:name:", error);
        res.status(500);
        res.json({ message: "Failed to update contact: " + error.message });
    } finally {
        await client.close();
    }
});
