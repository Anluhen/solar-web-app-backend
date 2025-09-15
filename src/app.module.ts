import { Module } from "@nestjs/common";
import ItemsModule from "./modules/items/items.module";
import ConfigurationModule from "./modules/configuration/configuration.module";
import HealthModule from "./modules/health/heath.module";
import PostgresModule from "./modules/postgres/postgres.module";
import StaffModule from "./modules/staff/staff.module";
import { EnviosModule } from "./modules/envios/envios.module";
import { MateriaisModule } from "./modules/materiais/materiais.module";
import { TesteController } from "./teste.controller";

@Module({
    imports: [
        ItemsModule,
        ConfigurationModule,
        HealthModule,
        PostgresModule,
        StaffModule,
        EnviosModule,
        MateriaisModule,
    ],
    controllers: [TesteController],
})
export class AppModule { }
