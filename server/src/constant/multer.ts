import { application } from "express";

export const MAX_FILE_SIZE= 100 * 1024 * 1024;
export const MAX_FILES=10;
export const ALLOWED_MIME_TYPES=[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'image/gif',

    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    'text/plain',
    'text/csv',

    'application/zip',
    'application/x-zip-compressed',
    'application/x-tar',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',

    'audio/wav',
    'audio/webm',

    'video/mp4',
    'video/webm'
]

