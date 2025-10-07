import { Module } from "@nestjs/common";
import mailServiceProvider from "./services/mail.service";
import { ConfigService } from "@nestjs/config";

@Module({
    imports: [ConfigService],
    providers: [mailServiceProvider],
})
export default class MailModule {}
