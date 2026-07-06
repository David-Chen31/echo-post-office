'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BackHeader } from '@/components/ui';

export default function RulesPage() {
  const [rules, setRules] = useState<string[]>([
    '尊重他人，不进行人身攻击',
    '不索要联系方式',
    '不发布广告和交易信息',
    '不提供危险建议',
    '遇到严重危机时寻求现实中的专业帮助',
  ]);
  const [emergency, setEmergency] = useState<string>(
    '如果你正处在危险或极度痛苦中，请立即联系现实中可信任的人或当地紧急服务。本平台不能替代专业帮助。',
  );

  useEffect(() => {
    api.get<{ value: string[] }>('/configs/community.rules').then((r) => Array.isArray(r.value) && setRules(r.value)).catch(() => {});
    api.get<{ value: string }>('/configs/emergency.notice').then((r) => r.value && setEmergency(r.value)).catch(() => {});
  }, []);

  return (
    <main className="pb-16">
      <BackHeader title="社区约定" />

      <section className="mt-6">
        <h1 className="font-hand text-[26px] text-ink">这是一个安静、真诚的地方</h1>
        <p className="mt-3 font-print text-[15px] leading-relaxed text-ink2">
          这里提供的是陌生人之间的书信交流。回信的人不是专业咨询师，平台内容不能替代医疗、心理、法律等专业服务。
        </p>
      </section>

      <section className="mt-8">
        <p className="mb-3 font-ui text-[13px] text-ink2">在这里，我们约定：</p>
        <div className="card paper-grain p-6">
          <ul className="space-y-4">
            {rules.map((r, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="font-hand text-[18px] text-stamp">{i + 1}、</span>
                <span className="font-print text-[15px] leading-relaxed text-ink">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-8 rounded-card border border-stamp/30 bg-stamp/5 p-5">
        <p className="font-ui text-[13px] font-medium text-stamp">遇到紧急情况</p>
        <p className="mt-2 font-print text-[14px] leading-relaxed text-ink">{emergency}</p>
      </section>
    </main>
  );
}
