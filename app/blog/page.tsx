import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "블로그 | NEMO PLAN",
  description: "우선순위 관리와 생산성에 관한 글",
};

const posts = [
  {
    slug: "eisenhower-matrix-basics",
    title: "아이젠하워 매트릭스란 무엇인가",
    excerpt:
      "긴급함과 중요함, 두 개의 축으로 할 일을 나누는 오래된 방법이 왜 지금도 유효한지 살펴봅니다.",
    date: "2026.08.04",
    readTime: "4분",
  },
  {
    slug: "urgent-vs-important",
    title: "긴급한 일과 중요한 일을 구분하는 법",
    excerpt:
      "매일 밀려드는 할 일 중에서 정말 먼저 해야 할 일을 가려내는 실전 기준을 정리했습니다.",
    date: "2026.08.04",
    readTime: "5분",
  },
  {
    slug: "ai-task-breakdown",
    title: "AI로 할일을 쪼개는 것의 장단점",
    excerpt:
      "막연한 할 일을 AI가 작은 단위로 나눠줄 때 실제로 도움이 되는 경우와, 오히려 방해가 되는 경우를 구분해봅니다.",
    date: "2026.08.04",
    readTime: "4분",
  },
  {
    slug: "solo-multi-project-priority",
    title: "1인 프로젝트를 여러 개 굴릴 때의 우선순위 관리",
    excerpt:
      "혼자서 여러 프로젝트를 동시에 진행할 때 흔히 겪는 우선순위 혼란과, 이를 정리하는 방법을 다룹니다.",
    date: "2026.08.04",
    readTime: "5분",
  },
  {
    slug: "five-minute-morning-routine",
    title: "하루를 시작하기 전 5분 루틴",
    excerpt:
      "출근 전이든, 책상 앞에 앉은 직후든, 하루의 순서를 정하는 데 걸리는 시간은 5분이면 충분합니다.",
    date: "2026.08.04",
    readTime: "3분",
  },
];

export default function BlogIndexPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
      <header className="mb-12 border-b border-neutral-200 pb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          블로그
        </h1>
        <p className="mt-3 text-sm text-neutral-500">
          우선순위 관리와 생산성에 관한 글
        </p>
      </header>

      <ul className="space-y-10">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} className="group block">
              <h2 className="text-lg font-semibold text-neutral-900 group-hover:text-neutral-600">
                {post.title}
              </h2>
              <p className="mt-2 leading-relaxed text-neutral-600">
                {post.excerpt}
              </p>
              <p className="mt-3 text-sm text-neutral-400">
                {post.date} · {post.readTime} 읽기
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
