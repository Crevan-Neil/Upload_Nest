import apiKeyModel from "../models/apiKeys.model";
import { NotFoundException } from "../utils/app-error";
import { generateAPIKey } from "../utils/key"


export const createApiKeyService= async(userId: string, name:string)=>{
    const { rawKey, hashedKey, displayKey }= generateAPIKey();
    const apiKey= new apiKeyModel({
        userId,
        name,
        hashedKey,
        displayKey
    })
    await apiKey.save();
    return {
        rawKey
    }
}

export const getAllApiKeysService= async(userId: string, pagination: {
    pageSize:number;
    pageNumber:number;
})=>{
    const { pageSize, pageNumber }= pagination;
    const skip= (Math.max(1, pageNumber)-1)* pageSize;

    const [apiKeys, totalCount] = await Promise.all([
        apiKeyModel.find({ userId })
            .skip(skip)
            .limit(pageSize)
            .sort({ createdAt: -1 }),
        apiKeyModel.countDocuments({ userId })
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
        apiKeys,
        pagination: {
            pageSize,
            pageNumber,
            totalCount,
            totalPages,
            skip
        }
    };
}

export const deleteApiKeyService= async(userId:string, apiKeyid: string)=>{
    const result= await apiKeyModel.deleteOne({
        _id: apiKeyid,
        userId
    })
    if(result.deletedCount===0){
        throw new NotFoundException('API Key not found');
    }
    return{
        deletedCount: result.deletedCount
    }
}