import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiCode, fail } from '@letter/shared';
import { BusinessException } from '../errors/business.exception';

/**
 * 全局异常 -> 统一 { code, data: null, message }。
 * 生产可在此接入 Sentry。
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    if (exception instanceof BusinessException) {
      res.status(exception.getStatus()).json(fail(exception.bizCode, exception.message));
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const codeMap: Record<number, number> = {
        [HttpStatus.BAD_REQUEST]: ApiCode.BAD_REQUEST,
        [HttpStatus.UNAUTHORIZED]: ApiCode.UNAUTHORIZED,
        [HttpStatus.FORBIDDEN]: ApiCode.FORBIDDEN,
        [HttpStatus.NOT_FOUND]: ApiCode.NOT_FOUND,
        [HttpStatus.TOO_MANY_REQUESTS]: ApiCode.RATE_LIMITED,
        [HttpStatus.CONFLICT]: ApiCode.CONFLICT,
      };
      const bizCode = codeMap[status] ?? ApiCode.INTERNAL;
      const resp = exception.getResponse();
      const message =
        typeof resp === 'string' ? resp : ((resp as { message?: string }).message ?? exception.message);
      res.status(status).json(fail(bizCode, String(message)));
      return;
    }

    this.logger.error('Unhandled exception', exception as Error);
    res
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(fail(ApiCode.INTERNAL, '服务器开了会儿小差，请稍后再试'));
  }
}
