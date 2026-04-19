import { Router } from "express";
import authRoutes from "./auth.route";
import fileRoutes from "./files.route";
import { passportAuthenticateJwt } from "../../config/passport.config";
import analyticsRoutes from "./analytics.route";
import apikeyRoutes from "./apikey.route";


const internalRoutes= Router();

internalRoutes.use("/auth",authRoutes);
internalRoutes.use("/files", passportAuthenticateJwt ,fileRoutes);
internalRoutes.use("/analytics", passportAuthenticateJwt ,analyticsRoutes);
internalRoutes.use("/apikey", passportAuthenticateJwt, apikeyRoutes);

export default internalRoutes;