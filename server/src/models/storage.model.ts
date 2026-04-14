import mongoose, { Document, Model, Schema, Types } from "mongoose";
import fileModel from "./file.model";
import { BadRequestException } from "../utils/app-error";
import { formatBytes } from "../utils/format-byte";
import { ErrorCodeEnum } from "../enums/error-code.enum";


export const STORAGE_QUOTA= 2* 1024* 1024* 1024;

interface IStorage{
    userId: Types.ObjectId;
    storageQuota: number;
    createdAt: Date;
    updatedAt: Date;
}

interface StorageMetrics{
    quota: number;
    usage: number;
    remaining: number;
}

interface UploadValidation{
    allowed: boolean;
    newUsage: number;
    remainingAfterUpload: number;
}

interface StorageStatics{
    getStorageMetrics(userId: Types.ObjectId): Promise<StorageMetrics>;
    validateUpload(userId: Types.ObjectId, fileSize: number): Promise<UploadValidation>;
}

interface StorageDocument extends IStorage, Document{}

interface StorageModelType extends Model<StorageDocument>, StorageStatics{}

const storageSchema= new Schema<StorageDocument, StorageModelType>({
    userId:{
        type: Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    storageQuota:{
        type: Number,
        default: STORAGE_QUOTA,
        min: [0, "Storage quota cannot be negative"]
    }
},{
    timestamps: true
})

storageSchema.statics={
    async getStorageMetrics(userId: Types.ObjectId){
        const storage= await this.findOne({userId}).lean();
        if(!storage)throw new Error("Storage record not found");
        const usage= await fileModel.calculateUsage(userId);
        return {
            quota: storage.storageQuota,
            usage: usage,
            remaining: storage.storageQuota-usage
        }
    },

    async validateUpload(userId: Types.ObjectId, totalFileSize:number){
        if(totalFileSize<0){
            throw new BadRequestException("File size must be positive");
        }
        const metrics= await this.getStorageMetrics(userId);
        const hasSpace= metrics.remaining>=totalFileSize;
        if(!hasSpace){
            const shortFall= totalFileSize- metrics.remaining;
            throw new BadRequestException(`Insufficient storage. ${formatBytes(shortFall)} needed.`,
            ErrorCodeEnum.INSUFFICIENT_STORAGE
            )
        }
        return {
            allowed: true,
            newUsage: metrics.usage + totalFileSize,
            remainingAfterUpload: metrics.remaining-totalFileSize
        }
    }
}

const storageModel= mongoose.model<StorageDocument, StorageModelType>("storage", storageSchema);
export default storageModel;