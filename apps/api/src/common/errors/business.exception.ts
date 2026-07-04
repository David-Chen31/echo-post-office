import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 业务异常：携带业务错误码（见 @letter/shared ApiCode）。
 * 由全局过滤器转换为统一 { code, data, message } 响应。
 */
export class BusinessException extends HttpException {
  constructor(
    public readonly bizCode: number,
    message: string,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(message, httpStatus);
  }
}
