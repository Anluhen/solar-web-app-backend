import { Controller, Get } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { Public } from "../../authentication/guards/jwt-strategy.guard";

@ApiExcludeController()
@Controller("/health")
export class HealthController {
    constructor() {}

    @Public()
    @Get("/liveness")
    livenessProbe() {
        return { status: "ok" };
    }

    @Public()
    @Get("/readiness")
    readinessProbe() {
        return { status: "ok" };
    }
}
