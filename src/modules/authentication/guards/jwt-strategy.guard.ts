import { Injectable, ExecutionContext, SetMetadata } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { AuthGuard, PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { passportJwtSecret } from "jwks-rsa";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import UserEntity from "../entities/user.entity";

// --- Public route marker ---

export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// --- Global JWT guard ---

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (isPublic) {
            return true;
        }

        return super.canActivate(context);
    }
}

// --- JWT strategy (validates token and maps payload to UserEntity) ---

@Injectable()
export class JWTStrategy extends PassportStrategy(Strategy) {
    private audience: string;

    constructor(jwksUri: string, audience: string, issuer: string) {
        super({
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: jwksUri,
            }),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            audience: audience,
            issuer: issuer,
            algorithms: ["RS256"],
        });

        this.audience = audience;
    }

    validate(payload: any): UserEntity {
        return {
            username: payload.preferred_username,
            name: payload.name,
            token: undefined,
            roles: payload["resource_access"]
                ? payload["resource_access"][this.audience].roles
                : [],
        };
    }
}

// --- Providers to be registered in the module ---

export const jwtStrategyGuardProvider = {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
};

export const JWTStrategyProvider = {
    provide: "JWT_STRATEGY",
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
        const response = await fetch(
            configService.getOrThrow("OPENID_WELL_KNOWN_URL"),
        );
        const { jwks_uri } = await response.json();

        return new JWTStrategy(
            jwks_uri,
            configService.getOrThrow("AUDIENCE"),
            configService.getOrThrow("AUTH_SERVER_ISSUER"),
        );
    },
};
