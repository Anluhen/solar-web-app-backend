import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import ConfigurationModule from "../configuration/configuration.module";
import { ConfigService } from "@nestjs/config";
import ENV_VARIABLE_NAMES from "src/utils/env_variable_names";
import StaffEntity from "../staff/entities/staff.entity";

const PostgresModule = TypeOrmModule.forRootAsync({
    name: "postgreConnection",
    imports: [ConfigurationModule],
    inject: [ConfigService],
    useFactory: async (
        configService: ConfigService,
    ): Promise<TypeOrmModuleOptions> => ({
        type: "postgres",
        host: configService.getOrThrow(ENV_VARIABLE_NAMES.POSTGRESQL_HOST),
        port: configService.getOrThrow(ENV_VARIABLE_NAMES.POSTGRESQL_PORT),
        username: configService.getOrThrow(
            ENV_VARIABLE_NAMES.POSTGRESQL_USERNAME,
        ),
        password: configService.getOrThrow(
            ENV_VARIABLE_NAMES.POSTGRESQL_PASSWORD,
        ),
        database: configService.getOrThrow(ENV_VARIABLE_NAMES.POSTGRESQL_NAME),
        autoLoadEntities: true,
        synchronize: true,
    }),
});

export default PostgresModule;
