import { PrismaClient } from '@prisma/client';

// 授予管理员/审核员角色。用法：
//   npx tsx prisma/promote-admin.ts <email> [admin|moderator]
const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = process.argv[2];
  const role = (process.argv[3] ?? 'admin').toLowerCase();
  if (!email) {
    console.error('用法: npx tsx prisma/promote-admin.ts <email> [admin|moderator]');
    process.exit(1);
  }
  if (!['admin', 'moderator', 'user'].includes(role)) {
    console.error(`非法角色: ${role}（可选 admin | moderator | user）`);
    process.exit(1);
  }
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    console.error(`找不到邮箱为 ${email} 的用户`);
    process.exit(1);
  }
  await prisma.user.update({ where: { id: user.id }, data: { role } });
  console.log(`已将 ${email}（userId=${user.id}）设为 ${role}。请重新登录以刷新令牌角色。`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
