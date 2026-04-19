import { Router } from "express";
import { multiUpload } from "../../../config/multer.config";
import { CheckStorageAvailability } from "../../../middlewares/check-storage.middleware";
import { uploadFilesViaAPIController } from "../../../controllers/files.controller";


const fileV1Routes= Router();

fileV1Routes.post("/upload", multiUpload, CheckStorageAvailability, uploadFilesViaAPIController);

export default fileV1Routes;