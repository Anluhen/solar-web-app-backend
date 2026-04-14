import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import KaizenEntity from "./entities/kaizen.entity";
import { KaizenController } from "./controllers/kaizen.controller";
import kaizenServiceProvider from "./services/kaizen.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([KaizenEntity], "postgreConnection"),
    ],
    controllers: [KaizenController],
    providers: [kaizenServiceProvider],
})
export default class KaizenModule {}
