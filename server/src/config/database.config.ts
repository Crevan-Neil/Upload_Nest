import { logger } from "../utils/logger";
import { Env } from "./env.config";
import mongoose from "mongoose";


const connectDatabase= async() =>{
    try{
        await mongoose.connect(Env.MONGO_URI);
        logger.info("Connected to Mongo database")
    } catch(error){
        logger.error("Error connecting to Mongo database", error);
        process.exit(1);
    }
}

const disconnectDatabase= async() =>{
    try{
        await mongoose.disconnect();
        logger.info("Disconnected from Mongo database")
    } catch(error){
        logger.error("Error disconnecting from Mongo database", error);
        process.exit(1);
    }
}

export {connectDatabase, disconnectDatabase};