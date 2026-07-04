import { Body, Controller, Delete, Get, Patch, Post } from '@nestjs/common';
import { blockUserSchema, updateProfileSchema, BlockUserDto, UpdateProfileDto } from '@letter/shared';
import { ProfileView, UserService } from './user.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
export class UserController {
  constructor(private readonly user: UserService) {}

  @Get('me')
  async me(@CurrentUser('userId') userId: bigint): Promise<ProfileView> {
    return this.user.getProfile(userId);
  }

  @Patch('me')
  async update(
    @CurrentUser('userId') userId: bigint,
    @Body(new ZodValidationPipe(updateProfileSchema)) dto: UpdateProfileDto,
  ): Promise<ProfileView> {
    return this.user.updateProfile(userId, dto);
  }

  @Post('me/blocks')
  async block(
    @CurrentUser('userId') userId: bigint,
    @Body(new ZodValidationPipe(blockUserSchema)) dto: BlockUserDto,
  ): Promise<{ ok: boolean }> {
    return this.user.blockUser(userId, dto);
  }

  @Delete('me')
  async remove(@CurrentUser('userId') userId: bigint): Promise<{ ok: boolean }> {
    return this.user.requestDeletion(userId);
  }
}
