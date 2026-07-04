import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { ZodSchema } from 'zod';
import { ApiCode } from '@letter/shared';
import { BusinessException } from '../errors/business.exception';

/**
 * 用 zod schema 校验请求体。配合 @Body(new ZodValidationPipe(schema)) 使用。
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const msg = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      throw new BusinessException(ApiCode.BAD_REQUEST, `参数校验失败: ${msg}`);
    }
    return result.data;
  }
}
