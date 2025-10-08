import  express  from "express";

import redisClient from "./config/redis";
import resourceRoutes from "../src/routes/resourceRoutes"

import path from 'path';


const app = express();
app.use(express.json());

app.use(resourceRoutes);

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

app.get('/demo', (req, res) => {
    res.sendFile(path.join(__dirname, '../demo.html'));
});






startServer();