import {
    BadRequestException,
    Injectable,
    ClassProvider,
    NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Client, BucketItem } from "minio";
import { CreateFileResponseDto } from "../dto/create-file-response.dto";
import { UpdateFileResponseDto } from "../dto/update-file-response.dto";
import { DeleteFileResponseDto } from "../dto/delete-file-response.dto";
import { GetFilesNamesDto } from "../dto/get-files.dto";
import { GetUrlFileDto } from "../dto/get-url-file.dto";
import { MinioAuditDto, MinioFileInfo } from "../dto/minio-audit.dto";
import ENV_VARIABLE_NAMES from "src/utils/env_variable_names";
import Projeto from "src/modules/projetos/entities/projeto.entity";

@Injectable()
export class MinioService {
    private minioClient: Client;
    private bucketName: string;

    constructor(
        private readonly configService: ConfigService,
        @InjectRepository(Projeto, "postgreConnection") private readonly projetoRepo: Repository<Projeto>,
    ) {
        this.minioClient = new Client({
            endPoint: this.configService.get<string>(ENV_VARIABLE_NAMES.MINIO_ENDPOINT, "localhost"),
            useSSL: this.configService.get<string>(ENV_VARIABLE_NAMES.MINIO_SSL, "true") === "true",
            accessKey: this.configService.get<string>(ENV_VARIABLE_NAMES.MINIO_ACCESS_KEY),
            secretKey: this.configService.get<string>(ENV_VARIABLE_NAMES.MINIO_SECRET_KEY),
        });
        this.bucketName = this.configService.get<string>(ENV_VARIABLE_NAMES.MINIO_BUCKET);
    }

    async uploadFile(
        file: Express.Multer.File,
        fileName: string,
    ): Promise<CreateFileResponseDto> {
        const result = await this.minioClient.putObject(
            this.bucketName,
            fileName,
            file.buffer,
        );

        return {
            message: "File uploaded successfully.",
            fileName,
            etag: result.etag,
        };
    }

    async getUrlFile(fileName: string): Promise<GetUrlFileDto> {
        const exists = await this.fileExists(fileName);
        if (!exists) {
            throw new NotFoundException(`File "${fileName}" not found.`);
        }

        const url = await this.minioClient.presignedGetObject(
            this.bucketName,
            fileName,
            3600,
        );

        return { url };
    }

    async updateFile(
        file: Express.Multer.File,
        fileName: string,
    ): Promise<UpdateFileResponseDto> {
        const exists = await this.fileExists(fileName);
        if (!exists) {
            throw new NotFoundException(`File "${fileName}" not found.`);
        }

        const result = await this.minioClient.putObject(
            this.bucketName,
            fileName,
            file.buffer,
        );

        return {
            message: "File updated successfully.",
            fileName,
            etag: result.etag,
        };
    }

    async deleteFile(fileName: string): Promise<DeleteFileResponseDto> {
        const exists = await this.fileExists(fileName);
        if (!exists) {
            throw new NotFoundException(`File "${fileName}" not found.`);
        }

        await this.minioClient.removeObject(this.bucketName, fileName);

        return {
            message: "File deleted successfully.",
            fileName,
        };
    }

    async listFiles(): Promise<GetFilesNamesDto> {
        return new Promise((resolve, reject) => {
            const files: string[] = [];
            const stream = this.minioClient.listObjectsV2(this.bucketName, "", true);

            stream.on("data", (obj) => {
                if (obj.name) files.push(obj.name);
            });

            stream.on("end", () => resolve({ files }));
            stream.on("error", reject);
        });
    }

    async audit(): Promise<MinioAuditDto> {
        const files = await new Promise<MinioFileInfo[]>((resolve, reject) => {
            const result: MinioFileInfo[] = [];
            const stream = this.minioClient.listObjectsV2(this.bucketName, "", true);
            stream.on("data", (obj: BucketItem) => {
                if (obj.name) {
                    result.push({ name: obj.name, size: obj.size ?? 0, lastModified: obj.lastModified ?? new Date(0) });
                }
            });
            stream.on("end", () => resolve(result));
            stream.on("error", reject);
        });

        const projetos = await this.projetoRepo.find({
            select: ["id", "anexo_ov", "anexo_outro"],
        });

        const referencedSet = new Set<string>();
        for (const p of projetos) {
            if (p.anexo_ov) referencedSet.add(p.anexo_ov);
            if (p.anexo_outro) referencedSet.add(p.anexo_outro);
        }

        const fileNames = new Set(files.map(f => f.name));
        const orphanNames = files.filter(f => !referencedSet.has(f.name)).map(f => f.name);
        const referencedNames = [...referencedSet].filter(name => fileNames.has(name));

        return { files, referencedNames, orphanNames };
    }

    private async fileExists(fileName: string): Promise<boolean> {
        try {
            await this.minioClient.statObject(this.bucketName, fileName);
            return true;
        } catch {
            return false;
        }
    }
}
