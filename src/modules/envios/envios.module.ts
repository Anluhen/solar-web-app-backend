import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import Envio from "./entities/envio.entity";
import MaterialEntity from "../materiais/entities/material.entity";
import enviosServiceProvider from "./services/envios.service";
import { StatusRulesService } from "./rules/status.rules";
import { EnviosController } from "./controllers/envios.controller";
import MateriaisModule from "../materiais/materiais.module";
import MailModule from "../mail/mail.module";
import AppConfigModule from "../app-config/app-config.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Envio, MaterialEntity], "postgreConnection"),
        MateriaisModule,
        MailModule,
        AppConfigModule,
    ],
    controllers: [EnviosController],
    providers: [enviosServiceProvider, StatusRulesService],
    exports: [TypeOrmModule, enviosServiceProvider],
})
export default class EnviosModule {}
