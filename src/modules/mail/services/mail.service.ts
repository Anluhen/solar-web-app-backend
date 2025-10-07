import { Injectable, ClassProvider } from "@nestjs/common";
import { IMailService } from "../interfaces/mail.service.interface";
import { ConfigService } from "@nestjs/config";
import nodemailer, { Transporter } from "nodemailer";
import ENV_VARIABLE_NAMES from "src/utils/env_variable_names";

@Injectable()
class MailService implements IMailService {
    private readonly transporter: Transporter;

    constructor(private readonly configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            // Create a test account
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: "maddison53@ethereal.email",
                pass: "jn7jnAPss4f63QBp6D",
            },

            // Uses a real account
            // host: this.configService.getOrThrow(ENV_VARIABLE_NAMES.MAIL_HOST),
            // port: this.configService.getOrThrow(ENV_VARIABLE_NAMES.MAIL_PORT),
            // secure: true,
            // auth: {
            //   type: this.configService.getOrThrow(ENV_VARIABLE_NAMES.MAIL_AUTH),
            //   user: this.configService.getOrThrow(ENV_VARIABLE_NAMES.MAIL_USERNAME),
            //   pass: this.configService.getOrThrow(ENV_VARIABLE_NAMES.MAIL_PASSWORD),
            // },
        });
    }

    async sendMail(
        to: string | string[],
        subject: string,
        html: string,
        text?: string,
    ): Promise<void> {
        try {
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
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        } catch (err) {
            console.error("Error while sending mail", err);
        }
    }
}

const mailServiceProvider: ClassProvider<IMailService> = {
    provide: IMailService,
    useClass: MailService,
};

export default mailServiceProvider;
