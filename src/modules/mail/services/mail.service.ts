import { Injectable, ClassProvider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { createTransport, getTestMessageUrl } from "nodemailer";
import { IMailService } from "../interfaces/mail.service.interface";
import ENV_VARIABLE_NAMES from "src/utils/env_variable_names";

@Injectable()
class MailService implements IMailService {
    private readonly isDev: boolean;

    constructor(private readonly configService: ConfigService) {
        this.isDev =
            this.configService.getOrThrow(ENV_VARIABLE_NAMES.NODE_ENV) ===
            "development";

        if (this.isDev) {
            console.log("Mail service: dev mode — will use Ethereal test account");
        } else {
            console.log("Mail service: production mode — will use Microsoft Graph API");
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

            await this.sendViaGraph(to, subject, html, userToken);
        } catch (err) {
            console.error("Error while sending mail", err);
            throw err instanceof Error
                ? err
                : new Error("Unexpected error while sending mail");
        }
    }

    private async sendViaGraph(
        to: string | string[],
        subject: string,
        html: string,
        userToken: string,
    ): Promise<void> {
        const recipients = (Array.isArray(to) ? to : [to]).map((address) => ({
            emailAddress: { address },
        }));

        const body = {
            message: {
                subject,
                body: {
                    contentType: "HTML",
                    content: html,
                },
                toRecipients: recipients,
            },
        };

        console.log("Sending mail via Graph API to %s", to);

        await axios.post(
            "https://graph.microsoft.com/v1.0/me/sendMail",
            body,
            {
                headers: {
                    Authorization: userToken,
                    "Content-Type": "application/json",
                },
            },
        );

        console.log("Message sent via Graph API");
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
