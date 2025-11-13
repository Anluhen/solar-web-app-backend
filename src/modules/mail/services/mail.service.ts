import { Injectable, ClassProvider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, getTestMessageUrl, Transporter } from "nodemailer";
import { IMailService } from "../interfaces/mail.service.interface";
import ENV_VARIABLE_NAMES from "src/utils/env_variable_names";

@Injectable()
class MailService implements IMailService {
    private readonly transporter: Transporter;
    private readonly usesTestAccount: boolean;
    private readonly isProd: boolean;

    constructor(private readonly configService: ConfigService) {
        const configuredHost = this.configService.get<string>(
            ENV_VARIABLE_NAMES.MAIL_HOST,
        );

        console.log("Creating transport...");
        const configuredPort = Number(
            this.configService.getOrThrow(ENV_VARIABLE_NAMES.MAIL_PORT),
        );

        if (Number.isNaN(configuredPort)) {
            throw new Error("MAIL_PORT must be a valid number");
        }

        const isDev =
            this.configService.getOrThrow(ENV_VARIABLE_NAMES.NODE_ENV) ===
            "development";

        this.isProd =
            this.configService.getOrThrow(ENV_VARIABLE_NAMES.NODE_ENV) ===
            "production";

        const mailOptions = {
            host: configuredHost,
            port: configuredPort,
            secure: false,
            auth: {
                user: this.configService.getOrThrow(
                    ENV_VARIABLE_NAMES.MAIL_USERNAME,
                ),
                pass: this.configService.getOrThrow(
                    ENV_VARIABLE_NAMES.MAIL_PASSWORD,
                ),
            },
            tls: {
                rejectUnauthorized: false,
            },
        };

        const testOptions = {
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: "bernadette.bradtke84@ethereal.email",
                pass: "zhst7ucu5Zsc2n5Ucu",
            },
        };

        const options = isDev ? testOptions : mailOptions;

        this.transporter = createTransport(options);
        this.usesTestAccount = isDev;

        if (isDev) {
            console.log(
                "Test transport created in host: %s:%s",
                testOptions.host,
                testOptions.host,
            );
        } else {
            console.log(
                "Transport created in host: %s:%s",
                mailOptions.host,
                mailOptions.port,
            );
        }
    }

    async sendMail(
        to: string | string[],
        subject: string,
        html: string,
        userEmail: string,
        text?: string,
    ): Promise<void> {
        try {
            const sender = userEmail;
            const mailFrom = this.configService.getOrThrow(
                ENV_VARIABLE_NAMES.MAIL_USERNAME,
            );
            const toArray = Array.isArray(to) ? to : [to];

            console.log(
                "Sending mail from host: %s",
                this.configService.getOrThrow(ENV_VARIABLE_NAMES.MAIL_HOST),
            );
            console.log("Sending mail from user: %s", mailFrom);
            console.log("Sending mail as %s", sender);
            console.log("Sending mail to %s", toArray.join(", "));

            const info = await this.transporter.sendMail({
                from: mailFrom,
                cc: sender,
                to,
                subject,
                html,
                ...(text ? { text } : {}),
            });

            console.log("Message sent: %s", info.messageId);
            if (this.usesTestAccount) {
                console.log("Preview URL: %s", getTestMessageUrl(info));
            }
        } catch (err) {
            console.error("Error while sending mail", err);
            throw err instanceof Error
                ? err
                : new Error("Unexpected error while sending mail");
        }
    }
}

const mailServiceProvider: ClassProvider<IMailService> = {
    provide: IMailService,
    useClass: MailService,
};

export default mailServiceProvider;
