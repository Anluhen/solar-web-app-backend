import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import ConfigurationModule from "../configuration/configuration.module";
import { ConfigService } from "@nestjs/config";
import ENV_VARIABLE_NAMES from "src/utils/env_variable_names";

const PostgresModule = TypeOrmModule.forRootAsync({
    name: "postgreConnection",
    imports: [ConfigurationModule],
    inject: [ConfigService],
    useFactory: async (
        configService: ConfigService,
    ): Promise<TypeOrmModuleOptions> => ({
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
        migrations: ["src/migrations/*.ts"],
    }),
});

export default PostgresModule;
