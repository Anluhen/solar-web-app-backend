import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MinioController } from "./controllers/minio.controller";
import { MinioService } from "./services/minio.service";
import Projeto from "../projetos/entities/projeto.entity";

@Module({
    imports: [ConfigModule, TypeOrmModule.forFeature([Projeto], "postgreConnection")],
    controllers: [MinioController],
    providers: [MinioService],
    exports: [MinioService],
})
export class MinioModule {}
