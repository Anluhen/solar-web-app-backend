import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import AppConfig from "./entities/app-config.entity";
import { AppConfigService } from "./services/app-config.service";

@Module({
    imports: [TypeOrmModule.forFeature([AppConfig], "postgreConnection")],
    providers: [AppConfigService],
    exports: [AppConfigService],
})
export default class AppConfigModule {}
