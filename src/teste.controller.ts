import { Controller, Get } from "@nestjs/common";

@Controller("teste")
export class TesteController {
  @Get()
  teste(): string {
    return "Hello Wolrd!";
  }
}
