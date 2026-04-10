import { ErrorRequestHandler, Request, Response, NextFunction } from "express";
import { HTTPSTATUS } from "../config/http.config";
import { AppError } from "../utils/app-error";


export const errorHandler: ErrorRequestHandler= (
    error,
    req,
    res,
    next
): any=>{
    console.log(`Error occured on PATH ${req.path}`,{
        body: req.body,
        params: req.params,
        error
    })

    if(error instanceof SyntaxError && 'body' in error){
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            message: "Invalid json format, please check your request body"
        })
    }
    if(error instanceof AppError){
        return res.status(error.statusCode).json({
            message: error.message,
            errorCode: error.errorCode
        })
    }
    return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
        error: error?.message || "Unknown error"
    })
} 