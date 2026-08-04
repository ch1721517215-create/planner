import Link from "next/link";

export default function ArticleLayout({
  title,
  date,
  readTime,
  children,
}: {
  title: string;
  date: string;
  readTime: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
      <Link
        href="/blog"
        className="text-sm text-neutral-500 hover:text-neutral-700"
      >
        ← 목록으로
      </Link>

      <header className="mt-6 mb-10 border-b border-neutral-200 pb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-neutral-500">
          {date} · {readTime} 읽기
        </p>
      </header>

      <article className="space-y-6 leading-relaxed text-neutral-700">
        {children}
      </article>

      <footer className="mt-16 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
        <Link href="/blog" className="underline underline-offset-2 hover:text-neutral-700">
          다른 글 더 보기
        </Link>
      </footer>
    </main>
  );
}
