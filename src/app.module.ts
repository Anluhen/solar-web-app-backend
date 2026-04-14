import { Module } from "@nestjs/common";
import ItemsModule from "./modules/items/items.module";
import ConfigurationModule from "./modules/configuration/configuration.module";
import HealthModule from "./modules/health/heath.module";
import PostgresModule from "./modules/postgres/postgres.module";
import StaffModule from "./modules/staff/staff.module";
import EnviosModule from "./modules/envios/envios.module";
import MateriaisModule from "./modules/materiais/materiais.module";
import MailModule from "./modules/mail/mail.module";
import ProjetosModule from "./modules/projetos/projetos.module";
import { AuthenticationModule } from "./modules/authentication/authentication.module";
import KaizenModule from "./modules/kaizen/kaizen.module";

@Module({
    imports: [
        ItemsModule,
        ConfigurationModule,
        AuthenticationModule,
        HealthModule,
        KaizenModule,
        PostgresModule,
        StaffModule,
        EnviosModule,
        MateriaisModule,
        MailModule,
        ProjetosModule,
    ],
})
export class AppModule {}
