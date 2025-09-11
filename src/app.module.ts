import { Module } from "@nestjs/common";
import ItemsModule from "./modules/items/items.module";
import ConfigurationModule from "./modules/configuration/configuration.module";
import HealthModule from "./modules/health/heath.module";
import PostgresModule from "./modules/postgres/postgres.module";
import StaffModule from "./modules/staff/staff.module";
import { TesteController } from "./teste.controller";

@Module({
    imports: [
        ItemsModule,
        ConfigurationModule,
        HealthModule,
        PostgresModule,
        StaffModule,
    ],
    controllers: [TesteController],
})
export class AppModule { }