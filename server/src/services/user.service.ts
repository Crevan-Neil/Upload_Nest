import userModel from "../models/user.model";

export const findByIdUserService=async(userId:string)=>{
    return await userModel.findById(userId);
}