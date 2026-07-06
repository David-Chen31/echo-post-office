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
    {
      key: 'home.stories',
      value: [
        '“写下那封信的时候，我以为不会有人回。三天后收到回信，第一句是‘我认真读完了’，我在地铁上就哭了。”',
        '“我给一个陌生人回了信。不知道他是谁，但那天之后，我觉得自己也没那么糟。”',
        '“这里没有点赞，没有热搜，只有一封一封慢慢寄出的信。像小时候等一封远方的来信。”',
      ],
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
    {
      title: '毕业以后',
      content:
        '毕业半年了，身边的朋友好像都渐渐走远。大家都很忙，聊天记录停在几个月前。我不是难过，只是有点不习惯，原来长大就是慢慢学会一个人。今天想把这种感觉写给一个陌生人听听。',
      category: 'FRIENDSHIP' as const,
      mood: 'CALM' as const,
    },
    {
      title: '想对妈妈说的话',
      content:
        '有些话当面说不出口。妈妈这些年很辛苦，我却总是对她不耐烦。其实我很爱她，只是不知道怎么表达。把这封信写出来，好像心里松了一点。谢谢你愿意读到这里。',
      category: 'FAMILY' as const,
      mood: 'GRATEFUL' as const,
    },
    {
      title: null,
      content:
        '换了新城市工作，一切都要重新开始。白天强撑着笑脸，晚上回到出租屋才敢卸下来。不是撑不住，只是偶尔想有个人说一句“辛苦了”。就当这封信是寄给未来更从容的自己。',
      category: 'WORK' as const,
      mood: 'TIRED' as const,
    },
    {
      title: '关于一个人的遗憾',
      content:
        '很多年前有个人，我一直没说出口那句喜欢。后来各自天涯，偶尔想起还是会心里一动。不是想挽回什么，只是想承认——那段心动是真的，也是值得的。写下来，就当放下了。',
      category: 'REGRET' as const,
      mood: 'CALM' as const,
    },
    {
      title: '最近有点迷茫',
      content:
        '不知道自己想要什么，好像做什么都提不起劲。看着别人都很笃定，只有我在原地打转。我知道这样下去不行，可就是走不出来。也许说出来，会好受一点。',
      category: 'CONFUSION' as const,
      mood: 'CONFUSED' as const,
    },
    {
      title: null,
      content:
        '一个人住久了，最怕生病的夜晚。前几天发烧，倒水都要扶着墙走。那一刻特别想家。现在好了，回头看看，也算是自己照顾好了自己。写给同样一个人生活的你，我们都要好好的。',
      category: 'LONELINESS' as const,
      mood: 'HOPEFUL' as const,
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
