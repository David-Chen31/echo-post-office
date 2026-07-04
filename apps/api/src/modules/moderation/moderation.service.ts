import { Injectable } from '@nestjs/common';
import { ModerationAction, ModTargetType, RiskLevel } from '@letter/shared';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { detectAll, isContactType, isHighRiskType, maskContent, DetectHit } from './detectors';

export interface ModTarget {
  type: ModTargetType;
  id: bigint;
  content: string;
}

export interface AutoCheckResult {
  riskLevel: RiskLevel;
  hits: DetectHit[];
  /** 联系方式遮挡后的内容（若无命中则与原文一致） */
  maskedContent: string;
  /** 是否需要进入人工审核队列 */
  needsManual: boolean;
}

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 自动检测：联系方式遮挡 + 风险词识别。
   * - 命中高风险词（自伤/暴力/诈骗）-> HIGH，需人工审核。
   * - 仅命中联系方式/广告等 -> LOW，自动遮挡放行。
   * - 无命中 -> NONE。
   */
  async autoCheck(target: ModTarget): Promise<AutoCheckResult> {
    const hits = detectAll(target.content);
    const hasHighRisk = hits.some((h) => isHighRiskType(h.type));
    const hasContact = hits.some((h) => isContactType(h.type));

    let riskLevel: RiskLevel = RiskLevel.NONE;
    if (hasHighRisk) riskLevel = RiskLevel.HIGH;
    else if (hits.length > 0) riskLevel = RiskLevel.LOW;

    const maskedContent = hasContact ? maskContent(target.content, hits) : target.content;
    const needsManual = riskLevel === RiskLevel.HIGH;

    // 持久化命中明细
    if (hits.length > 0) {
      await this.prisma.sensitiveHit.createMany({
        data: hits.map((h) => ({
          targetType: target.type,
          targetId: target.id,
          type: h.type,
          matched: h.matched.slice(0, 255),
          startPos: h.startPos,
          endPos: h.endPos,
          masked: isContactType(h.type),
        })),
      });
    }

    // 记录一条自动审核留痕
    await this.recordAction(
      target,
      needsManual ? ModerationAction.ESCALATE : hasContact ? ModerationAction.MASK_PASS : ModerationAction.PASS,
      null,
      { riskLevel, hitTypes: hits.map((h) => h.type) },
    );

    return { riskLevel, hits, maskedContent, needsManual };
  }

  /** 人工审核动作留痕。 */
  async review(
    operatorId: bigint,
    target: ModTarget,
    action: ModerationAction,
    note?: string,
  ): Promise<void> {
    await this.recordAction(target, action, operatorId, { note }, note);
  }

  private async recordAction(
    target: ModTarget,
    action: ModerationAction,
    operatorId: bigint | null,
    autoResult: Record<string, unknown>,
    note?: string,
  ): Promise<void> {
    await this.prisma.moderationRecord.create({
      data: {
        targetType: target.type,
        targetId: target.id,
        action,
        operatorId: operatorId ?? undefined,
        autoResult: autoResult as object,
        note,
      },
    });
  }
}
