import { Module } from "@nestjs/common";
import {
    jwtStrategyGuardProvider,
    JWTStrategyProvider,
} from "./guards/jwt-strategy.guard";
import { ConfigModule } from "@nestjs/config";

@Module({
    imports: [ConfigModule],
    providers: [jwtStrategyGuardProvider, JWTStrategyProvider],
    exports: [],
})
export class AuthenticationModule {}
