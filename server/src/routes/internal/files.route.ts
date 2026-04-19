import { Router } from "express";
import { multiUpload } from "../../config/multer.config";
import { deleteFilesController, downloadFilesController, getAllFilesController, uploadFilesViaWebController } from "../../controllers/files.controller";
import { CheckStorageAvailability } from "../../middlewares/check-storage.middleware";

const fileRoutes= Router();

fileRoutes.post("/upload", multiUpload, CheckStorageAvailability ,uploadFilesViaWebController);
fileRoutes.get("/all", getAllFilesController);
fileRoutes.delete("/bulk-delete", deleteFilesController);
fileRoutes.post("/download", downloadFilesController);

export default fileRoutes;