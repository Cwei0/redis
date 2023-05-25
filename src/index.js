import "dotenv/config";
import { env } from "process";
import express from "express";
import { createClient } from "redis";
import axios from "axios";

const client = createClient(env.REDIS_URL);
const app = express();
app.use(express.json());

// Adding data to redis
app.post("/", async (req, res) => {
    const { key, value } = req.body;
    const response = await client.set(key, value);
    res.json(response);
});

// Retrieving data
app.get("/", async (req, res) => {
    const { key } = req.body;
    const value = await client.get(key);
    res.json(value);
});

//Redis in Practice using Jsonplaceholder API
app.get("/posts/:id", async (req, res) => {
    const { id } = req.params;
    // Try retrieving data from redis
    const cachedPost = await client.get(`post-${id}`);
    // Add a guard statement
    if (cachedPost) return res.json(JSON.parse(cachedPost));

    const response = await axios.get(`https://jsonplaceholder.typicode.com/posts/${id}`);
    const { data } = response;
    await client.set(`post-${id}`, JSON.stringify(data), "EX", 3600);
    res.json(data);
});

app.listen(3100, async () => {
    console.log("Server running on port 3100");
    client.on("error", (err) => {
        console.log("Redis Client Error", err);
    });
    await client.connect();
});
