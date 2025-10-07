import { Injectable } from "@nestjs/common";

@Injectable()
export abstract class IMailService {
    abstract sendMail(
        to: string | string[],
        subject: string,
        html: string,
        text?: string,
    ): Promise<void>;
}
