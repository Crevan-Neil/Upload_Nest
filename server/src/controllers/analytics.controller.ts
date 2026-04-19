import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { HTTPSTATUS } from "../config/http.config";
import { getUserAnalyticsWithChartService } from "../services/analytics.service";


export const getUserAnalyticsWithChartController= asyncHandler(async(req:Request, res:Response)=>{
    const userId= req.user?._id?.toString() as string;

    const { from, to }= req.query;

    const filter={
        dateFrom: from ? new Date(from as string) : undefined,
        dateTo: from ? new Date(to as string) : undefined
    }
    const result= await getUserAnalyticsWithChartService(userId, filter);
    return res.status(HTTPSTATUS.OK).json({
        message: "User analytics retrieved successfully",
        ...result
    })
})