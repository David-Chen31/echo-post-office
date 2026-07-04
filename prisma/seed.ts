import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 冷启动内容（计划书九章 §4）：内容配置 + 种子回信者 + 示范信。
async function main(): Promise<void> {
  // ---- 内容配置 ----
  const configs: { key: string; value: unknown }[] = [
    {
      key: 'home.hero',
      value: {
        title: '有些话，不知道该说给谁听。',
        subtitle: '把它写成一封信，寄给一个愿意认真读完的人。',
      },
    },
    {
      key: 'community.rules',
      value: [
        '尊重他人，不进行人身攻击',
        '不索要联系方式',
        '不发布广告和交易信息',
        '不提供危险建议',
        '遇到严重危机时寻求现实中的专业帮助',
      ],
    },
    {
      key: 'risk.notice',
      value: '为保护你和对方，请不要在信中留下真实姓名、电话、微信等联系方式。',
    },
    {
      key: 'emergency.notice',
      value:
        '如果你正处在危险或极度痛苦中，请立即联系现实中可信任的人或当地紧急服务。本平台不能替代专业帮助。',
    },
    {
      key: 'reply.guide',
      value: ['表明你认真读完了', '复述或确认对方的感受', '分享你的理解', '提供有限而非命令式的建议', '留下一句温和的结束语'],
    },
  ];
  for (const c of configs) {
    await prisma.contentConfig.upsert({
      where: { key: c.key },
      create: { key: c.key, value: c.value as object },
      update: { value: c.value as object },
    });
  }

  // ---- 种子回信者 ----
  const replier = await prisma.user.upsert({
    where: { email: 'seed-replier@local' },
    create: {
      nickname: '晚风',
      accountType: 'EMAIL',
      email: 'seed-replier@local',
      isSeed: true,
      trustScore: 200,
      level: 'KEEPER',
      dailyClaimQuota: 10,
    },
    update: {},
  });

  // ---- 示范来信 ----
  const sampleAuthor = await prisma.user.upsert({
    where: { email: 'seed-author@local' },
    create: { nickname: '远方', accountType: 'EMAIL', email: 'seed-author@local', isSeed: true },
    update: {},
  });

  const samples = [
    {
      title: '考研前的夜晚',
      content:
        '最近总在深夜醒来，想着如果这次没考上该怎么办。白天还能假装平静，夜里却控制不住地胡思乱想。我没敢和家里人说，怕他们担心，也怕他们失望。只是想找个人，安静地说说这些。',
      category: 'STUDY' as const,
      mood: 'ANXIOUS' as const,
    },
    {
      title: null,
      content:
        '今天路过以前常去的那家小店，发现它关门了。突然就有点难过。好像生活里很多东西都是这样，没来得及好好告别就消失了。写下来，算是给那段日子一个交代吧。',
      category: 'LIFE_STORY' as const,
      mood: 'SAD' as const,
    },
  ];

  for (const s of samples) {
    const exists = await prisma.letter.findFirst({ where: { title: s.title, authorId: sampleAuthor.id } });
    if (exists) continue;
    await prisma.letter.create({
      data: {
        authorId: sampleAuthor.id,
        title: s.title,
        content: s.content,
        category: s.category,
        mood: s.mood,
        status: 'WAITING_CLAIM',
        publishedAt: new Date(),
      },
    });
  }

  console.log(`Seed done. replier=${replier.id}, author=${sampleAuthor.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
