import path from "node:path";
import fileModel, { UploadSourceEnum } from "../models/file.model";
import userModel from "../models/user.model";
import { BadRequestException, InternalServerException, NotFoundException, UnauthorizedException } from "../utils/app-error";
import { sanitizeFilename } from "../utils/helper";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Env } from "../config/env.config";
import { s3 } from "../config/aws-s3.config";
import { DeleteFilesSchemaType, DownloadFilesSchemaType, GetAllFilesSchemaType } from "../validators/file.validator";
import archiver from "archiver";
import { PassThrough, Readable } from "node:stream";
import { Upload } from "@aws-sdk/lib-storage";




export const uploadFilesService=async(userId: string, files: Express.Multer.File[], uploadedVia: keyof typeof UploadSourceEnum)=>{
    const user= await userModel.findOne({_id:userId});
    if(!user)throw new UnauthorizedException("Unauthorized access");
    if(!files?.length)throw new BadRequestException("No files provided");

    const results= await Promise.allSettled(
        files.map(async(file)=>{
            let _storageKey: string | null= null;
            try{
                const { storageKey } = await uploadToS3(file,userId);
                _storageKey= storageKey;
                const createdFile= await fileModel.create({
                    userId,
                    storageKey,
                    originalName: file.originalname,
                    uploadVia: uploadedVia,
                    size: file.size,
                    ext: path.extname(file.originalname)?.slice(1)?.toLowerCase(),
                    url:"",
                    mimeType: file.mimetype
                })
                return{
                    fileId: createdFile._id,
                    originalName: createdFile.originalName,
                    size: createdFile.size,
                    ext: createdFile.ext,
                    mimeType: createdFile.mimeType
                }
            }catch(error){
                logger.error("Error uploading file", error);
                if(_storageKey){}
            }
        })
    )
    const successfulRes= results.filter(r => r.status === "fulfilled").map(r => r.value);
    const failedRes= results.filter(r => r.status === "rejected").map((r) => r.reason.message);

    if(failedRes.length>0){
        logger.warn("Failed to upload files", files);
        throw new InternalServerException(`Failed to upload ${failedRes.length} out of ${files.length} files`)
    }
    return {
        message: `Uploaded ${successfulRes.length} out of ${files.length} files`,
        data: successfulRes
    };
}

async function uploadToS3(file: Express.Multer.File, userId: string, meta?: Record<string, string>){
    const ext= path.extname(file.originalname);
    const basename= path.basename(file.originalname, ext);
    const cleanName= sanitizeFilename(basename).substring(0,64);
    logger.info(sanitizeFilename(basename), cleanName);
    const storageKey= `users/${userId}/${uuidv4()}-${cleanName}${ext}`;

    const command= new PutObjectCommand({
        Bucket:Env.AWS_S3_BUCKET!,
        Key: storageKey,
        Body: file.buffer,
        ...(meta && {Metadata: meta})
    })
    await s3.send(command);
    //const url= `https://${Env.AWS_S3_BUCKET}.s3.${Env.AWS_REGION}.amazonaws.com/${storageKey}`;
    return{
        storageKey
    }
}

async function deleteFromS3(storageKey: string){
    try{
        const command= new DeleteObjectCommand({
            Bucket: Env.AWS_S3_BUCKET!,
            Key: storageKey
        })
        await s3.send(command);
    } catch(error){
        logger.error("Failed to delete file from S3", storageKey);
        throw error;
    }
}

export const getAllFilesService=async(userId: string, filter: Pick<GetAllFilesSchemaType, "keyword">, pagination: Omit<GetAllFilesSchemaType, "keyword">)=>{
    const { keyword }= filter;
    const filterConditions: Record<string,any> ={
        userId
    }
    if(keyword){
        filterConditions.$or=[
            {
                originalName:{
                    $regex: keyword,
                    $options: 'i'
                }
            }
        ]
    }
    const { pageSize, pageNumber }= pagination;
    const skip= (Math.max(1, pageNumber)-1)*pageSize;

    const [files, totalCount] = await Promise.all([
        fileModel.find(filterConditions)
            .skip(skip)
            .limit(pageSize)
            .sort({createdAt: -1}),
        fileModel.countDocuments(filterConditions)
    ]);

    const filesWithUrls = await Promise.all(
        files.map(async (file) => {
            const url = await getFileFromS3({
                storageKey: file.storageKey,
                mimeType: file.mimeType,
                expiresIn: 3600
            });
            return {
                ...file.toObject(),
                url,
                storageKey: undefined
            };
        })
    );
    const totalPages= Math.ceil(totalCount/pageSize);
    return{
        files: filesWithUrls,

        pagination:{
            pageSize,
            pageNumber,
            totalCount,
            totalPages,
            skip
        }
    }
}

async function getFileFromS3({ storageKey, expiresIn = 3600, filename, mimeType }: { storageKey: string; expiresIn?: number; filename?: string, mimeType?: string; }) {
    try{
        const command = new GetObjectCommand({
            Bucket: Env.AWS_S3_BUCKET!,
            Key: storageKey,
            ...(!filename && {
                ResponseContentType: mimeType,
                ResponseContentDisposition: `inline`
            }),
            ...(filename && {
                ResponseContentDisposition: `attachment; filename="${filename}"`
            })
        });
        return await getSignedUrl(s3, command, { expiresIn });
    } catch(error){
        logger.error(`Failed to get file from S3: ${storageKey}`);
        throw error;
    }
}

export const getFileUrlService= async(fileId:string)=>{
    const file= await fileModel.findOne({ _id: fileId });
    if(!file) throw new NotFoundException('File not found');
    const stream = await getS3ReadStream(file.storageKey);
    //const url= await getFileFromS3({
        //storageKey: file.storageKey,
        //mimeType: file.mimeType,
        //expiresIn: 3600
    //})
    return{
        url:"",
        stream,
        contentType: file.mimeType,
        fileSize: file.size
    }
}

export const deleteFilesService = async (userId: string, data: DeleteFilesSchemaType) => {
    const { fileIds } = data;
    const files = await fileModel.find({
        _id: { $in: fileIds }
    })
    if(!files.length) throw new NotFoundException("No files found");

    const s3Errors: string[]= [];
    await Promise.all(
        files.map(async(file)=>{
            try{
                await deleteFromS3(file.storageKey);
            } catch(error){
                logger.error(`Failed to delete ${file.storageKey} from s3`, error);
                s3Errors.push(file.storageKey);
            }
        })
    )
    const successfulFileIds= files.filter((file)=> !s3Errors.includes(file.storageKey))
    .map((file)=> file._id);

    const { deletedCount }= await fileModel.deleteMany({
        _id: { $in: successfulFileIds},
        userId
    })
    if (s3Errors.length > 0) {
        logger.warn(`Failed to delete ${s3Errors.length} files from S3`);
    }
    return {
        deletedCount,
        failedCount: s3Errors.length
    };
}

export const downloadFilesService = async (userId: string, data: DownloadFilesSchemaType) => {
    const { fileIds } = data;
    const files = await fileModel.find({
        _id: { $in: fileIds }
    })
    if(!files.length){
        throw new NotFoundException("No files found");
    }
    if(files.length===1){
        const signedUrl= await getFileFromS3({
            storageKey: files[0].storageKey,
            filename: files[0].originalName
        })
        return{
            url: signedUrl,
            isZip: false
        }
    }
    const url = await handleMultipleFilesDownload(files,userId);
    return{
        url,
        isZip: true
    }
}

async function handleMultipleFilesDownload(files: Array<{storageKey: string; originalName: string}>,userId: string){
    const timestamp= Date.now();
    const zipKey= `temp-zips/${userId}/${timestamp}.zip`;

    const zipFilename= `uploadnest-${timestamp}.zip`;

    const zip= archiver('zip', { zlib: { level:6 }});

    const passThrough= new PassThrough();
    zip.on('error', (err: Error)=>{
        passThrough.destroy(err);
    })

    const upload= new Upload({
        client: s3,
        params:{
            Bucket: Env.AWS_S3_BUCKET,
            Key: zipKey,
            Body: passThrough,
            ContentType: 'application/zip'
        }
    })
    zip.pipe(passThrough);

    for(const file of files){
        try{
            const stream= await getS3ReadStream(file.storageKey);
            zip.append(stream, { name: sanitizeFilename(file.originalName)})
        } catch(error){
            zip.destroy(error instanceof Error ? error : new Error(String(error)));
            throw error
        }
    }
    await zip.finalize();
    await upload.done();
    const url= await getFileFromS3({
        storageKey: zipKey,
        filename: zipFilename,
        expiresIn: 3600
    })
    return url;
}

async function getS3ReadStream(storageKey: string){
    try{
        const command= new GetObjectCommand({
            Bucket: Env.AWS_S3_BUCKET!,
            Key: storageKey
        })
        const response= await s3.send(command);
        if(!response.Body){
            logger.warn(`No body returned for key: ${storageKey}`);
            throw new InternalServerException(`No body returned for key`);
        }
        return response.Body as Readable;
    } catch(error){
        logger.error(`Error getting s3 stream for key: ${storageKey}`);
        throw new InternalServerException(`Failed to retrieve file`);
    }
}

