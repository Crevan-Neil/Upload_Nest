
import mongoose from "mongoose";
import { LoginSchemaType, RegisterSchemaType } from "../validators/auth.validator";
import userModel from "../models/user.model";
import { NotFoundException, UnauthorizedException } from "../utils/app-error";
import storageModel from "../models/storage.model";
import { logger } from "../utils/logger";
import { signJwtToken } from "../utils/jwt";


export const registerService=async(body:RegisterSchemaType)=>{
    const { email }= body;
    const session= await mongoose.startSession();
    try{
        await session.withTransaction(async()=>{
            const exisitngUser= await userModel.findOne({
                email
            }).session(session);
            if(exisitngUser)throw new UnauthorizedException("User already exists");
            const newUser= new userModel({
                ... body,
                profilePicture: body.profilePicture || null
            })
            await newUser.save({session});
            const storage= new storageModel({
                userId: newUser._id
            })
            await storage.save({session});
            return {user: newUser.omitPassword()};
        })
    } catch(error){
        logger.error("Error registering user",error);
        throw error;
    } finally{
        await session.endSession();
    }
}

export const loginService=async(body: LoginSchemaType)=>{
    const { email, password }= body;
    const user= await userModel.findOne({email});
    if(!user)throw new NotFoundException("Email/Password not found");
    const isPasswordValid= await user.comparePassword(password);
    if(!isPasswordValid)throw new UnauthorizedException("Email/Password is incorrect");
    const { token, expiresAt}= signJwtToken({
        userId: user.id
    })
    return{
        user: user.omitPassword(),
        accessToken: token,
        expiresAt
    }
}