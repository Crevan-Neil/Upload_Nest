import mongoose, {  Document, Schema, Types } from "mongoose";
import { compareValue, hashValue } from "../utils/bcrypt";

export interface UserDocument extends Document{
    _id: Types.ObjectId;
    name: string;
    email: string;
    password: string;
    profilePicture: string | null;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(value: string): Promise<boolean>;
    omitPassword(): Omit<UserDocument, "password">;
}

const userSchema= new Schema<UserDocument>({
    name:{
        type: String,
        required: true,
        trim: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password:{
        type: String,
        required: true,
        select: true
    },
    profilePicture:{
        type: String,
        default: null
    }
}, {
    timestamps: true
})

userSchema.pre("save", async function(){
    if(this.isModified("password")){
        if(this.password){
            this.password= await hashValue(this.password);
        }
    }
})

userSchema.methods.comparePassword= async function(value:string){
    return compareValue(value, this.password);
}

userSchema.methods.omitPassword= function(): Omit<UserDocument, "password">{
    const userObj= this.toObject();
    delete userObj.password;
    return userObj;
}

const userModel= mongoose.model<UserDocument>("user", userSchema);

export default userModel;
