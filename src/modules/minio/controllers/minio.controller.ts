import {
    Controller,
    Post,
    Get,
    Put,
    Delete,
    Param,
    Query,
    UploadedFile,
    UseInterceptors,
    UseGuards,
    InternalServerErrorException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
    ApiTags,
    ApiConsumes,
    ApiBody,
    ApiQuery,
    ApiOperation,
} from "@nestjs/swagger";
import { MinioService } from "../services/minio.service";
import { CreateFileResponseDto } from "../dto/create-file-response.dto";
import { UpdateFileResponseDto } from "../dto/update-file-response.dto";
import { DeleteFileResponseDto } from "../dto/delete-file-response.dto";
import { GetFilesNamesDto } from "../dto/get-files.dto";
import { GetUrlFileDto } from "../dto/get-url-file.dto";
import { MinioAuditDto } from "../dto/minio-audit.dto";
import RolesGuard, { Roles, Role } from "../../authentication/guards/roles.guard";

@ApiTags("minio")
@Controller("minio")
export class MinioController {
    constructor(private readonly minioService: MinioService) {}

    @Post()
    @ApiOperation({ summary: "Upload a new file" })
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                file: { type: "string", format: "binary" },
            },
        },
    })
    @ApiQuery({ name: "fileName", required: true, type: String })
    @UseInterceptors(FileInterceptor("file"))
    uploadFile(
        @UploadedFile() file: Express.Multer.File,
        @Query("fileName") fileName: string,
    ): Promise<CreateFileResponseDto> {
        return this.minioService.uploadFile(file, fileName);
    }

    @Get("files")
    @ApiOperation({ summary: "List all files in the bucket" })
    async listFiles(): Promise<GetFilesNamesDto> {
        try {
            return await this.minioService.listFiles();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            throw new InternalServerErrorException(`MinIO unavailable: ${msg}`);
        }
    }

    @Get("audit")
    @ApiOperation({ summary: "Audit bucket — list all files with orphan detection" })
    async auditFiles(): Promise<MinioAuditDto> {
        try {
            return await this.minioService.audit();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            throw new InternalServerErrorException(`MinIO unavailable: ${msg}`);
        }
    }

    @Get("generate-link/:fileName")
    @ApiOperation({ summary: "Get a presigned download URL for a file" })
    getUrlFile(@Param("fileName") fileName: string): Promise<GetUrlFileDto> {
        return this.minioService.getUrlFile(fileName);
    }

    @Put()
    @ApiOperation({ summary: "Update (overwrite) an existing file" })
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                file: { type: "string", format: "binary" },
            },
        },
    })
    @ApiQuery({ name: "fileName", required: true, type: String })
    @UseInterceptors(FileInterceptor("file"))
    updateFile(
        @UploadedFile() file: Express.Multer.File,
        @Query("fileName") fileName: string,
    ): Promise<UpdateFileResponseDto> {
        return this.minioService.updateFile(file, fileName);
    }

    @Delete(":fileName")
    @ApiOperation({ summary: "Delete a file (Admin only)" })
    @UseGuards(RolesGuard)
    @Roles(Role.Admin)
    deleteFile(
        @Param("fileName") fileName: string,
    ): Promise<DeleteFileResponseDto> {
        return this.minioService.deleteFile(fileName);
    }
}
