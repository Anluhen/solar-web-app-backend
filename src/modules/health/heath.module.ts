import { Module } from "@nestjs/common";
import { HealthController } from "./controllers/health.controller";

@Module({
    controllers: [HealthController],
})
export default class HealthModule {}
