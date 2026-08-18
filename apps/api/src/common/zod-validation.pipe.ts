import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { ZodType } from "zod";

/** zod schema -> Nest 校验管道，错误消息直接采用 schema 中的中文文案 */
export class ZodValidationPipe<S extends ZodType> implements PipeTransform {
  constructor(private readonly schema: S) {}

  transform(value: unknown): S["_output"] {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(result.error.issues[0]?.message ?? "参数无效");
    }
    return result.data;
  }
}
