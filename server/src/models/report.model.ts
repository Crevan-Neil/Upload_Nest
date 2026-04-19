import mongoose, { Document, Schema, Types } from "mongoose";

export interface ReportSettingDocument extends Document {
    userId: Types.ObjectId;
    frequency: string;
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const reportSettingSchema = new Schema<ReportSettingDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "user",
            required: true,
            unique: true,
        },
        frequency: {
            type: String,
            default: "DAILY",
        },
        isEnabled: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: function (_, ret: any) {
                if (ret._id) {
                    ret.id = ret._id.toString();
                }
                return ret;
            },
        },
        toObject: {
            virtuals: true,
            transform: function (_, ret: any) {
                if (ret._id) {
                    ret.id = ret._id.toString();
                }
                return ret;
            },
        },

    }
);


const reportSettingModel = mongoose.model<ReportSettingDocument>(
    "reportSetting",
    reportSettingSchema
);

export default reportSettingModel;
