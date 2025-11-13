import { Controller, Get } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
@ApiExcludeController()
@Controller("/health")
export class HealthController {
    constructor() {}
    @Get("/liveness")
    livenessProbe() {
        return { status: "ok" };
    }

    @Get("/readiness")
    readinessProbe() {
        return { status: "ok" };
    }
}
