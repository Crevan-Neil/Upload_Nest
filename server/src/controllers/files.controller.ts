import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { UploadSourceEnum } from "../models/file.model";
import { HTTPSTATUS } from "../config/http.config";
import { deleteFilesService, downloadFilesService, getAllFilesService, getFileUrlService, uploadFilesService } from "../services/file.service";
import { deleteFilesSchema, downloadFileSchema, fileIdSchema, getAllFilesSchema } from "../validators/file.validator";


export const uploadFilesViaWebController= asyncHandler(async(req: Request, res: Response)=>{
    const userId= req.user?._id;
    const files= req.files as Express.Multer.File[];
    const uploadedVia= UploadSourceEnum.WEB;

    const results= await uploadFilesService(userId, files, uploadedVia);
    return res.status(HTTPSTATUS.OK).json({
        results
    })
})

export const uploadFilesViaAPIController= asyncHandler(async(req: Request, res: Response)=>{
    const userId= req.user?._id;
    const files= req.files as Express.Multer.File[];
    const uploadedVia= UploadSourceEnum.API;

    const results= await uploadFilesService(userId, files, uploadedVia);
    return res.status(HTTPSTATUS.OK).json({
        results
    })
})

export const getAllFilesController= asyncHandler(async(req:Request, res: Response)=>{
    const userId= req.user?._id;
    const query = getAllFilesSchema.parse(req.query);

    const { keyword, pageSize, pageNumber } = query;

    const filter= {
        keyword
    }
    const pagination= {
        pageSize,
        pageNumber
    }
    const result= await getAllFilesService(userId, filter, pagination);

    return res.status(HTTPSTATUS.OK).json({
        message: "All files retrieved successfully",
        ...result
    })
})

export const publicGetFileUrlController= asyncHandler(async(req: Request, res:Response)=>{
    const fileId= fileIdSchema.parse(req.params.fileId);
    const { url, stream, contentType, fileSize }= await getFileUrlService(fileId);
    //return res.redirect(url);
    res.set({
        "Content-Type": contentType,
        "Content-Length": fileSize,
        "Cache-Control": 'public, max-age=3600',
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff"
    })
    stream.pipe(res);
})

export const deleteFilesController= asyncHandler(async(req: Request, res: Response)=>{
    const userId= req.user?._id;
    const data = deleteFilesSchema.parse(req.body);
    const result = await deleteFilesService(userId, data);

    return res.status(HTTPSTATUS.OK).json({
        message: "Files deleted successfully",
        ...result
    })

})


export const downloadFilesController= asyncHandler(async(req: Request, res: Response)=>{
    const userId= req.user?._id;
    const data= downloadFileSchema.parse(req.body);
    const result= await downloadFilesService(userId, data);
    return res.status(HTTPSTATUS.OK).json({
        message: "Files download URL successfully",
        downloadedUrl: result?.url,
        isZip: result?.isZip || false
    })
})