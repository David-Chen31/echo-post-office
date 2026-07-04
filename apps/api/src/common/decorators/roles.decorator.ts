import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type AppRole = 'user' | 'moderator' | 'admin';
/** 限定可访问的角色（管理后台接口）。 */
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
