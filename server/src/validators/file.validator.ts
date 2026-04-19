import { z } from "zod";

export const fileIdSchema= z.string().trim().min(1);

const baseSchema= z.object({
    fileIds: z.array(z.string().length(24, "Invalid file ID")).min(1, "Atleast one file ID must be provided")
})

export const deleteFilesSchema= baseSchema;
export const downloadFileSchema= baseSchema;

export const getAllFilesSchema= z.object({
    keyword: z.string().optional(),
    pageSize: z.string().optional().transform((val) => val ? parseInt(val) : 20).pipe(z.number().int().positive().max(100)).default(20),
    pageNumber: z.string().optional().transform((val) => val ? parseInt(val) : 1).pipe(z.number().int().positive()).default(1)
})

export type DeleteFilesSchemaType= z.infer<typeof deleteFilesSchema>;
export type DownloadFilesSchemaType= z.infer<typeof downloadFileSchema>;
export type GetAllFilesSchemaType= z.infer<typeof getAllFilesSchema>;