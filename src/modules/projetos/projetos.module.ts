import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import Projeto from "./entities/projeto.entity";
import ProjetoPep from "./entities/projeto-pep.entity";
import ProjetoItem from "./entities/projeto-item.entity";
import EnvioEntity from "../envios/entities/envio.entity";
import MaterialEntity from "../materiais/entities/material.entity";
import projetosServiceProvider from "./services/projetos.service";
import { ProjetosController } from "./controllers/projetos.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature(
            [Projeto, ProjetoPep, ProjetoItem, EnvioEntity, MaterialEntity],
            "postgreConnection",
        ),
    ],
    controllers: [ProjetosController],
    providers: [projetosServiceProvider],
    exports: [TypeOrmModule, projetosServiceProvider],
})
export default class ProjetosModule {}
