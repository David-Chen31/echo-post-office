import { Injectable } from '@nestjs/common';
import { ApiCode, BlockUserDto, UpdateProfileDto, UserLevel } from '@letter/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { BusinessException } from '../../common/errors/business.exception';

export interface ProfileView {
  userId: string;
  nickname: string;
  role: string;
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
      role: user.role,
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

  /**
   * 依据信任分重算等级与每日配额（信誉越高，领取额度越大）。
   * 在回信质量反馈后调用（计划书十一章）。
   */
  async recomputeLevelAndQuota(userId: bigint): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    const s = user.trustScore;
    let level: UserLevel;
    let claimQuota: number;
    let writeQuota: number;
    if (s >= 200) {
      level = UserLevel.KEEPER;
      claimQuota = 10;
      writeQuota = 3;
    } else if (s >= 120) {
      level = UserLevel.REPLIER;
      claimQuota = 5;
      writeQuota = 2;
    } else if (s >= 80) {
      level = UserLevel.READER;
      claimQuota = 3;
      writeQuota = 2;
    } else {
      level = UserLevel.NEWCOMER;
      claimQuota = 2;
      writeQuota = 1;
    }
    if (level !== user.level || claimQuota !== user.dailyClaimQuota || writeQuota !== user.dailyWriteQuota) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { level, dailyClaimQuota: claimQuota, dailyWriteQuota: writeQuota },
      });
    }
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
