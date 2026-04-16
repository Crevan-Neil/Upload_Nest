import { Env } from "../config/env.config";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";


type TimeUnit= 's' | 'm' | 'h' | 'd' | 'w' | 'y';
type TimeString= `${number}${TimeUnit}`;

export type AccessPayLoad= {
    userId: string;
}

type SignOptsAndSecret= SignOptions &{
    secret: string;
    expiresIn: TimeString | number;
}

const defaults: SignOptions={
    audience: ["user"]
}

export const accessTokenSignOptions: SignOptsAndSecret= {
    expiresIn: Env.JWT_EXPIRES_IN as TimeString,
    secret: Env.JWT_SECRET
}

export const signJwtToken=(
    payload: AccessPayLoad,
    options?: SignOptsAndSecret
)=>{
    const isAccessToken= !options || options === accessTokenSignOptions;
    const {secret, ...opts}= options || accessTokenSignOptions;

    const token=jwt.sign(payload, secret, {...defaults, ...opts})
    const expiresAt= isAccessToken ? (jwt.decode(token) as JwtPayload)?.exp! * 1000 : undefined;

    return{
        token,
        expiresAt
    }
}
