import { Global, Module } from "@nestjs/common";
import { SparkService } from "./spark.service";

@Global()
@Module({
  providers: [SparkService],
  exports: [SparkService],
})
export class SparkModule {}
