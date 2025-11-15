import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import ConfigurationModule from "../configuration/configuration.module";
import { ConfigService } from "@nestjs/config";
import ENV_VARIABLE_NAMES from "src/utils/env_variable_names";
import * as path from "path";

const PostgresModule = TypeOrmModule.forRootAsync({
    name: "postgreConnection",
    imports: [ConfigurationModule],
    inject: [ConfigService],
    useFactory: async (
        configService: ConfigService,
    ): Promise<TypeOrmModuleOptions> => {
        const isProduction = process.env.NODE_ENV === "production";
        const migrationsPath = isProduction
            ? path.resolve(__dirname, "../../migrations/*.js")
            : path.resolve(__dirname, "../../migrations/*.ts");

        return {
            type: "postgres",
            host: configService.getOrThrow(ENV_VARIABLE_NAMES.POSTGRES_HOST),
            port: configService.getOrThrow(ENV_VARIABLE_NAMES.POSTGRES_PORT),
            username: configService.getOrThrow(
                ENV_VARIABLE_NAMES.POSTGRES_USERNAME,
            ),
            password: configService.getOrThrow(
                ENV_VARIABLE_NAMES.POSTGRES_PASSWORD,
            ),
            database: configService.getOrThrow(
                ENV_VARIABLE_NAMES.POSTGRES_DATABASE,
            ),
            autoLoadEntities: true,
            synchronize: false,
            migrations: [migrationsPath],
        };
    },
});

export default PostgresModule;
