import express, { Request, Response, NextFunction, urlencoded} from "express";
import "dotenv/config"
import { Env } from "./config/env.config";
import cors, { CorsOptions } from "cors";
import { UnauthorizedException } from "./utils/app-error";
import helmet from "helmet";
import { asyncHandler } from "./middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "./config/http.config";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import { logger } from "./utils/logger";
import { connectDatabase, disconnectDatabase } from "./config/database.config";

const app= express();
const BASE_PATH=Env.BASE_PATH;

const allowedOrigins= Env.ALLOWED_ORIGINS.split(',');

const corsOptions: CorsOptions ={
    origin(origin, callback){
        if(!origin || allowedOrigins.includes(origin)){
            callback(null, true);
        } else{
            const errorMsg= `CORS error: Origin ${origin} is not allowed`;
            callback(new UnauthorizedException(errorMsg), false);
        }
    }

}

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(helmet());

app.get("/", asyncHandler(
    async(req: Request, res: Response)=>{
        res.status(HTTPSTATUS.OK).json({
            message: 'Hello Subscribe to the channel'
        })
    }
))

app.use(errorHandler);

async function startServer(){
    try{
        await connectDatabase();
        const server= app.listen(Env.PORT, ()=>{
            logger.info(`Server listening on port ${Env.PORT} in ${Env.NODE_ENV} mode`)
        })
        const shutdownSignals: NodeJS.Signals[]= ["SIGTERM", "SIGINT"];
        shutdownSignals.forEach((signal)=>{
            process.on(signal, async ()=>{
                logger.info(`${signal} recieved: shutting down gracefully`)
                try{
                    server.close(()=>{
                        logger.info(`HTTP server closed`);
                    })
                    await disconnectDatabase();
                    process.exit(0);
                } catch(error){
                    logger.error("Error occured during shutting down", error);
                    process.exit(1);
                }
            })
        })
    } catch(error){
        logger.error("Failed to start server", error);
        process.exit(1);
    }
}

startServer();