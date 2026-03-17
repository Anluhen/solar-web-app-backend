import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const User = createParamDecorator(
    (data: string, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        const user = request.user;
        const token = request.headers.authorization;

        const fullUser = data ? user?.[data] : user;

        fullUser.token = token;

        return fullUser;
    },
);
