import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: `config/.env`,
            isGlobal: true,
        }),
    ],
})
export default class ConfigurationModule {}
