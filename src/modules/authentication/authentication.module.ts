import { Module } from "@nestjs/common";
import {
    jwtStrategyGuardProvider,
    JWTStrategyProvider,
} from "./guards/jwt-strategy.guard";
import { ApiKeyGuard } from "./guards/api-key.guard";
import { PowerBiController } from "./controllers/powerbi.controller";
import { ConfigModule } from "@nestjs/config";
import ProjetosModule from "../projetos/projetos.module";
import EnviosModule from "../envios/envios.module";

@Module({
    imports: [ConfigModule, ProjetosModule, EnviosModule],
    controllers: [PowerBiController],
    providers: [jwtStrategyGuardProvider, JWTStrategyProvider, ApiKeyGuard],
    exports: [],
})
export class AuthenticationModule {}
