import { Controller, Get } from "@nestjs/common";

@Controller("teste")
export class TesteController {
  @Get()
  get(): { message: string } {
    return { message: 'Hello World!' };
  }
}
