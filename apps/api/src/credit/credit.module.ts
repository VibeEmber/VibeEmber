import { Global, Module } from "@nestjs/common";
import { CreditService } from "./credit.service";

@Global()
@Module({
  providers: [CreditService],
  exports: [CreditService],
})
export class CreditModule {}
