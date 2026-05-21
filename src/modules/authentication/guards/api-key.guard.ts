import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";

export const API_KEY_ROUTE = "apiKeyRoute";
export const ApiKeyRoute = () => SetMetadata(API_KEY_ROUTE, true);

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private configService: ConfigService,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const isApiKeyRoute = this.reflector.getAllAndOverride<boolean>(
            API_KEY_ROUTE,
            [context.getHandler(), context.getClass()],
        );

        if (!isApiKeyRoute) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers["x-api-key"];
        const validKey = this.configService.get<string>("API_KEY");

        if (!validKey) {
            throw new UnauthorizedException("API key not configured");
        }

        if (!apiKey || apiKey !== validKey) {
            throw new UnauthorizedException("Invalid API key");
        }

        return true;
    }
}

export const ApiKeyGuardProvider = {
    provide: "API_KEY_GUARD",
    useClass: ApiKeyGuard,
};
