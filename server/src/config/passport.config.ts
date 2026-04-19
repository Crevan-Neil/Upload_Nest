import {
    Strategy as JwtStrategy,
    ExtractJwt,
    StrategyOptions
} from 'passport-jwt';
import passport from 'passport';
import { Env } from './env.config';
import { findByIdUserService } from '../services/user.service';
import { logger } from '../utils/logger';

interface JwtPayload{
    userId: string;
}

const options: StrategyOptions= {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: Env.JWT_SECRET,
    audience: "user",
    algorithms: ['HS256']
}

passport.use(new JwtStrategy(options, async(payload: JwtPayload, done)=>{
    try{
        if(!payload.userId){
            logger.error("Authentication failed: Payload missing userId", payload);
            return done(null, false);
        }
        const user= await findByIdUserService(payload.userId);
        if(!user){
            logger.error(`Authentication failed: User not found for ID ${payload.userId}`);
            return done(null, false);
        }
        return done(null, user)
    } catch(error){
        logger.error("Authentication failed: Unexpected error in strategy", error);
        return done(null,false);
    }
}))

passport.serializeUser((user: any, done)=> done(null, user));
passport.deserializeUser((user:any, done)=> done(null, user));

export const passportAuthenticateJwt= passport.authenticate("jwt",{
    session: false
})