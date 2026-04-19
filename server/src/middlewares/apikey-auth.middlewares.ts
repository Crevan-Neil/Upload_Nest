import crypto from "crypto";
import { NextFunction, Request, Response } from "express";
import { UnauthorizedException } from "../utils/app-error";
import { KEY_TYPE, KeyType } from "../utils/key";
import apiKeyModel from "../models/apiKeys.model";
import { logger } from "../utils/logger";
import { findByIdUserService } from "../services/user.service";

export const apiKeyAuthMiddleware= async(req: Request, res: Response, next: NextFunction)=>{
    try{
        const authHeader= req.headers.authorization;

        if(!authHeader?.startsWith('Bearer')){
            throw new UnauthorizedException("API key required. Use Authorization Bearer <API_Key>");
        }

        const apiKey= authHeader.slice(7).trim();
        if(!apiKey) throw new UnauthorizedException("API key missing");

        if(!apiKey.startsWith('sk_') || apiKey.length<20){
            throw new UnauthorizedException("Invalid Api Key format");
        }
        const parts= apiKey.split('_');
        if(parts.length<3 || parts[0] !== 'sk'){
            throw new UnauthorizedException("Invalid Api Key format");
        }
        const keyType= parts[1];

        if(!Object.values(KEY_TYPE).includes(keyType as KeyType)){
            throw new UnauthorizedException("Invalid Api Key type");
        }
        const hashedKey= crypto.createHash('sha256').update(apiKey).digest('hex');

        const apiKeyDoc= await apiKeyModel.findOne({
            hashedKey
        }).select('+hashedKey').lean();
        if(!apiKeyDoc){
            logger.warn("API Key not found");
            throw new UnauthorizedException("Invalid API key");
        }

        const user= await findByIdUserService(apiKeyDoc.userId.toString());

        if(!user){
            throw new UnauthorizedException("User not found for this API key");
        }
        apiKeyModel.updateLastUsedAt(hashedKey).catch(logger.error);
        req.user=user;
        logger.info("API Key used", apiKeyDoc.displayKey);
        next();
    } catch(error){
        next(error);
    }
}