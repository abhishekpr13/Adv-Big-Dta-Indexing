import  express  from "express";

import redisClient from "./config/redis"


const app = express();
app.use(express.json());

// connecting to Redis server 
const startServer = async()=>{
    try {
        await redisClient.connect();
        console.log("connected to Reddis");
        const port = 8080 
    app.listen(port,()=>{
        console.log(`Server is running on http://localhost:${port}`);
    })
        
    } catch(error){
        console.log("Failed to start the server",error);
        process.exit(1);
    }
}


app.get('/test-redis', async (req, res) => {
    try {
        await redisClient.set('test', 'Hello Redis');
        const value = await redisClient.get('test');
        res.json({ message: 'Redis is working!', value });
    } catch (error) {
        res.status(500).json({ error: 'Redis connection failed' });
    }
});

startServer();