import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, ok } from '@letter/shared';

/**
 * 统一包装成功响应为 { code: 0, data, message }。
 * 若 handler 已返回符合 ApiResponse 结构则原样透传。
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'code' in data && 'data' in data) {
          return data as ApiResponse<T>;
        }
        return ok(data as T);
      }),
    );
  }
}
