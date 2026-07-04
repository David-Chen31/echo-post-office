import { Injectable } from '@nestjs/common';
import { ApiCode, BlockUserDto, UpdateProfileDto } from '@letter/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { BusinessException } from '../../common/errors/business.exception';

export interface ProfileView {
  userId: string;
  nickname: string;
  level: string;
  trustScore: number;
  interestedTopics: string[];
  blockedTopics: string[];
  dailyWriteQuota: number;
  dailyClaimQuota: number;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: bigint): Promise<ProfileView> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status === 'DELETED') {
      throw new BusinessException(ApiCode.NOT_FOUND, '用户不存在');
    }
    return {
      userId: user.id.toString(),
      nickname: user.nickname,
      level: user.level,
      trustScore: user.trustScore,
      interestedTopics: user.interestedTopics as string[],
      blockedTopics: user.blockedTopics as string[],
      dailyWriteQuota: user.dailyWriteQuota,
      dailyClaimQuota: user.dailyClaimQuota,
    };
  }

  async updateProfile(userId: bigint, dto: UpdateProfileDto): Promise<ProfileView> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.nickname !== undefined ? { nickname: dto.nickname } : {}),
        ...(dto.interestedTopics !== undefined ? { interestedTopics: dto.interestedTopics } : {}),
        ...(dto.blockedTopics !== undefined ? { blockedTopics: dto.blockedTopics } : {}),
      },
    });
    return this.getProfile(userId);
  }

  async blockUser(userId: bigint, dto: BlockUserDto): Promise<{ ok: boolean }> {
    const blockedId = BigInt(dto.blockedId);
    if (blockedId === userId) {
      throw new BusinessException(ApiCode.BAD_REQUEST, '不能拉黑自己');
    }
    await this.prisma.userBlock.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId } },
      create: { blockerId: userId, blockedId },
      update: {},
    });
    return { ok: true };
  }

  /** 注销账户：软删除 + 匿名化，保留必要风控记录。 */
  async requestDeletion(userId: bigint): Promise<{ ok: boolean }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'DELETED',
        nickname: '已注销用户',
        email: null,
        phone: null,
        passwordHash: null,
        deletedAt: new Date(),
      },
    });
    return { ok: true };
  }

  /** 供其它模块查询：该用户拉黑了哪些人（用于信件分配过滤）。 */
  async getBlockedIds(userId: bigint): Promise<bigint[]> {
    const rows = await this.prisma.userBlock.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    });
    return rows.map((r) => r.blockedId);
  }
}
