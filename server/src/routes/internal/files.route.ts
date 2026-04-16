import { Router } from "express";
import { multiUpload } from "../../config/multer.config";
import { getAllFilesConroller, uploadFilesViaWebController } from "../../controllers/files.controller";
import { CheckStorageAvailability } from "../../middlewares/check-storage.middleware";

const fileRoutes= Router();

fileRoutes.post("/upload", multiUpload, CheckStorageAvailability ,uploadFilesViaWebController);
fileRoutes.get("/all", getAllFilesConroller);

export default fileRoutes;