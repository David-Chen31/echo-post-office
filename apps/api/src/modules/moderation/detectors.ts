import { SensitiveType } from '@letter/shared';

export interface DetectHit {
  type: SensitiveType;
  matched: string;
  startPos: number;
  endPos: number;
}

interface Rule {
  type: SensitiveType;
  regex: RegExp;
}

// 联系方式 / 身份信息 —— 命中后默认遮挡（计划书：默认隐藏联系方式）。
const CONTACT_RULES: Rule[] = [
  { type: SensitiveType.PHONE, regex: /(?<!\d)1[3-9]\d{9}(?!\d)/g },
  { type: SensitiveType.WECHAT, regex: /(?:微信|vx|wechat|加我)\s*[:：]?\s*[a-zA-Z0-9_-]{5,20}/gi },
  { type: SensitiveType.EMAIL, regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
  { type: SensitiveType.ID_CARD, regex: /(?<!\d)\d{17}[\dXx](?!\d)/g },
  { type: SensitiveType.BANK, regex: /(?<!\d)\d{16,19}(?!\d)/g },
  // QQ/微信号一类归入 WECHAT 联系方式类别
  { type: SensitiveType.WECHAT, regex: /(?:qq|扣扣)\s*[:：]?\s*[1-9]\d{4,11}/gi },
];

// 风险词库（MVP 极简版，生产应替换为可维护词库 + 第三方内容安全）。
const KEYWORD_RULES: { type: SensitiveType; words: string[] }[] = [
  { type: SensitiveType.SELF_HARM, words: ['自杀', '轻生', '不想活', '想死', '结束生命', '自残'] },
  { type: SensitiveType.VIOLENCE, words: ['杀了你', '报复', '弄死'] },
  { type: SensitiveType.ABUSE, words: ['傻逼', '废物', '滚'] },
  { type: SensitiveType.AD, words: ['加微信', '免费领取', '扫码', '代理', '兼职日结'] },
  { type: SensitiveType.FRAUD, words: ['借钱', '转账', '红包', '刷单'] },
];

function findKeyword(content: string, type: SensitiveType, words: string[]): DetectHit[] {
  const hits: DetectHit[] = [];
  for (const w of words) {
    let idx = content.indexOf(w);
    while (idx !== -1) {
      hits.push({ type, matched: w, startPos: idx, endPos: idx + w.length });
      idx = content.indexOf(w, idx + w.length);
    }
  }
  return hits;
}

/** 运行全部检测规则，返回命中明细。 */
export function detectAll(content: string): DetectHit[] {
  const hits: DetectHit[] = [];

  for (const rule of CONTACT_RULES) {
    rule.regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = rule.regex.exec(content)) !== null) {
      hits.push({
        type: rule.type,
        matched: m[0],
        startPos: m.index,
        endPos: m.index + m[0].length,
      });
    }
  }

  for (const rule of KEYWORD_RULES) {
    hits.push(...findKeyword(content, rule.type, rule.words));
  }

  return hits;
}

const CONTACT_TYPES = new Set<SensitiveType>([
  SensitiveType.PHONE,
  SensitiveType.WECHAT,
  SensitiveType.EMAIL,
  SensitiveType.ID_CARD,
  SensitiveType.BANK,
]);

const HIGH_RISK_TYPES = new Set<SensitiveType>([
  SensitiveType.SELF_HARM,
  SensitiveType.VIOLENCE,
  SensitiveType.FRAUD,
]);

export function isContactType(t: SensitiveType): boolean {
  return CONTACT_TYPES.has(t);
}

export function isHighRiskType(t: SensitiveType): boolean {
  return HIGH_RISK_TYPES.has(t);
}

/** 遮挡命中片段（联系方式等）。从后往前替换，避免位置错乱。 */
export function maskContent(content: string, hits: DetectHit[]): string {
  const toMask = hits
    .filter((h) => isContactType(h.type))
    .sort((a, b) => b.startPos - a.startPos);
  let result = content;
  for (const h of toMask) {
    result = result.slice(0, h.startPos) + '＊＊＊＊' + result.slice(h.endPos);
  }
  return result;
}
