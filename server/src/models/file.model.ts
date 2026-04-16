import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { formatBytes } from "../utils/format-byte";

export enum UploadSourceEnum{
    WEB= "WEB",
    API= "API"
}

export interface FileDocument extends Document{
    userId: Types.ObjectId;
    originalName: string;
    storageKey: string;
    mimeType: string;
    size: number;
    ext: string;
    uploadVia: keyof typeof UploadSourceEnum;
    url: string;
    formattedSize: string;
    createdAt: Date;
    updatedAt: Date;
}

interface FileModelType extends Model<FileDocument>{
    calculateUsage(userId:Types.ObjectId): Promise<number>;
}

const fileSchema= new Schema<FileDocument, FileModelType>({
    userId:{
        type: Types.ObjectId,
        required: true,
        ref: "user"
    },
    originalName:{
        type: String,
        required: true
    },
    storageKey:{
        type: String,
        required: true,
        unique: true
    },
    mimeType:{
        type: String,
        required: true
    },
    size:{
        type: Number,
        required: true,
        min: 1
    },
    ext:{
        type: String,
        required: true
    },
    url:{
        type: String,
        required: false
    },
    uploadVia:{
        type: String,
        enum: Object.keys(UploadSourceEnum),
        required: true
    }
}, {
    timestamps: true,
    toJSON:{
        transform: (doc, ret)=>{
            ret.formattedSize= formatBytes(ret.size);
            return ret;
        }
    }
})

fileSchema.statics.calculateUsage= async function(userId: Types.ObjectId): Promise<number>{
    const result=await this.aggregate([
        {$match: { userId }},
        {
            $group: {
                _id:null,
                totalSize:{
                    $sum: '$size'
                }
            }
        }
    ])
    return result[0]?.totalSize || 0;
}

fileSchema.index({userId:1});
fileSchema.index({createdAt: -1});

const fileModel= mongoose.model<FileDocument, FileModelType>("file", fileSchema);

export default fileModel;