import bcrypt from "bcrypt";

export const hashValue= async function(value:string, saltRounds: number=10){
    return await bcrypt.hash(value, saltRounds);
}

export const compareValue= async function(value:string, hashedVal:string){
    return await bcrypt.compare(value, hashedVal);
}