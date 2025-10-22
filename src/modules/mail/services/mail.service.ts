import { Injectable, ClassProvider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, getTestMessageUrl, Transporter } from "nodemailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { IMailService } from "../interfaces/mail.service.interface";
import ENV_VARIABLE_NAMES from "src/utils/env_variable_names";

@Injectable()
class MailService implements IMailService {
    private readonly transporter: Transporter;
    private readonly usesTestAccount: boolean;

    constructor(private readonly configService: ConfigService) {
        const configuredHost = this.configService.get<string>(
            ENV_VARIABLE_NAMES.MAIL_HOST,
        );

        if (configuredHost) {
            console.log("Creating transport...")
            const configuredPort = Number(
                this.configService.getOrThrow(ENV_VARIABLE_NAMES.MAIL_PORT),
            );

            if (Number.isNaN(configuredPort)) {
                throw new Error("MAIL_PORT must be a valid number");
            }

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

            console.log("Transport created in host: %s:%s", mailOptions.host, mailOptions.host);
            this.transporter = createTransport(mailOptions);
            this.usesTestAccount = false;
            return;
        }

        console.log("Creating test transport...")
        const testAccountOptions: SMTPTransport.Options = {
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: "bernadette.bradtke84@ethereal.email",
                pass: "zhst7ucu5Zsc2n5Ucu",
            },
        };

        console.log("Test transport created in host: %s:%s", testAccountOptions.host, testAccountOptions.host);
        this.transporter = createTransport(testAccountOptions);
        this.usesTestAccount = true;
    }

    async sendMail(
        to: string | string[],
        subject: string,
        html: string,
        text?: string,
    ): Promise<void> {
        try {
            console.log("Sending mail...")
            const info = await this.transporter.sendMail({
                from: this.configService.getOrThrow(
                    ENV_VARIABLE_NAMES.MAIL_FROM,
                ),
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
