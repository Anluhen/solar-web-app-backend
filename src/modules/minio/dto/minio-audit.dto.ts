export interface MinioFileInfo {
    name: string;
    size: number;
    lastModified: Date;
}

export interface MinioAuditDto {
    files: MinioFileInfo[];
    referencedNames: string[];
    orphanNames: string[];
}
