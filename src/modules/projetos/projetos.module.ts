import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import Projeto from "./entities/projeto.entity";
import ProjetoItem from "./entities/projeto-item.entity";
import ProdutoOption from "./entities/produto-option.entity";
import EnvioEntity from "../envios/entities/envio.entity";
import MaterialEntity from "../materiais/entities/material.entity";
import ProjectPerson from "../project-people/entities/project-person.entity";
import projetosServiceProvider from "./services/projetos.service";
import { ProjetosController } from "./controllers/projetos.controller";
import MailModule from "../mail/mail.module";

@Module({
    imports: [
        TypeOrmModule.forFeature(
            [Projeto, ProjetoItem, ProdutoOption, EnvioEntity, MaterialEntity, ProjectPerson],
            "postgreConnection",
        ),
        MailModule,
    ],
    controllers: [ProjetosController],
    providers: [projetosServiceProvider],
    exports: [TypeOrmModule, projetosServiceProvider],
})
export default class ProjetosModule {}
