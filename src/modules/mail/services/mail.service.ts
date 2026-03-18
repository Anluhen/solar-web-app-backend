import { Injectable, ClassProvider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, getTestMessageUrl } from "nodemailer";
import { IMailService } from "../interfaces/mail.service.interface";
import ENV_VARIABLE_NAMES from "src/utils/env_variable_names";

@Injectable()
class MailService implements IMailService {
    private readonly isDev: boolean;
    private readonly host: string;
    private readonly port: number;

    constructor(private readonly configService: ConfigService) {
        const configuredPort = Number(
            this.configService.getOrThrow(ENV_VARIABLE_NAMES.MAIL_PORT),
        );

        if (Number.isNaN(configuredPort)) {
            throw new Error("MAIL_PORT must be a valid number");
        }

        this.isDev =
            this.configService.getOrThrow(ENV_VARIABLE_NAMES.NODE_ENV) ===
            "development";
        this.host = this.configService.get<string>(ENV_VARIABLE_NAMES.MAIL_HOST) ?? "";
        this.port = configuredPort;

        if (this.isDev) {
            console.log("Mail service: dev mode — will use Ethereal test account");
        } else {
            console.log(
                "Mail service: production mode — will use XOAUTH2 on %s:%s",
                this.host,
                this.port,
            );
        }
    }

    async sendMail(
        to: string | string[],
        subject: string,
        html: string,
        userEmail: string,
        userToken: string,
        text?: string,
    ): Promise<void> {
        try {
            if (this.isDev) {
                await this.sendDevMail(to, subject, html, userEmail, text);
                return;
            }

            const accessToken = userToken.replace(/^Bearer\s+/i, "");
            const transporter = createTransport({
                host: this.host,
                port: this.port,
                secure: false,
                auth: {
                    type: "OAuth2",
                    user: userEmail,
                    accessToken,
                },
                tls: {
                    rejectUnauthorized: false,
                },
            });

            console.log("Sending mail via XOAUTH2 as %s to %s", userEmail, to);

            const info = await transporter.sendMail({
                from: userEmail,
                to,
                subject,
                html,
                ...(text ? { text } : {}),
            });

            console.log("Message sent: %s", info.messageId);
        } catch (err) {
            console.error("Error while sending mail", err);
            throw err instanceof Error
                ? err
                : new Error("Unexpected error while sending mail");
        }
    }

    private async sendDevMail(
        to: string | string[],
        subject: string,
        html: string,
        userEmail: string,
        text?: string,
    ): Promise<void> {
        const transporter = createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: "bernadette.bradtke84@ethereal.email",
                pass: "zhst7ucu5Zsc2n5Ucu",
            },
        });

        console.log("Sending mail (dev/Ethereal) as %s to %s", userEmail, to);

        const info = await transporter.sendMail({
            from: userEmail,
            to,
            subject,
            html,
            ...(text ? { text } : {}),
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", getTestMessageUrl(info));
    }
}

const mailServiceProvider: ClassProvider<IMailService> = {
    provide: IMailService,
    useClass: MailService,
};

export default mailServiceProvider;
