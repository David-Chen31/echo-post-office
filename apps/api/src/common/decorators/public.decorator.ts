import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** 标记无需登录的接口（登录/注册/公开配置）。 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
