import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | NEMO PLAN",
  description: "NEMO PLAN을 만든 이유",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <header className="mb-12 border-b border-neutral-200 pb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          NEMO PLAN을 만든 이유
        </h1>
        <p className="mt-3 text-sm text-neutral-500">
          우선순위를 정하는 게 일보다 어려웠습니다
        </p>
      </header>

      <div className="space-y-8 leading-relaxed text-neutral-700">
        <p>
          25년 동안 편의점을 운영했습니다. 그 시간 동안 늘 해야 할 일은
          명확했어요. 발주하고, 진열하고, 재고를 맞추고, 손님을 응대하는 것.
          우선순위를 고민할 필요가 별로 없었습니다. 순서는 이미 정해져
          있었으니까요.
        </p>

        <p>
          가게를 정리하고 혼자서 여러 개의 프로젝트를 동시에 만들어가기
          시작하면서, 완전히 다른 문제를 마주했습니다. 앱을 만들고, 이커머스를
          공부하고, 콘텐츠를 쓰고, 사진을 정리하는 일이 한꺼번에 밀려왔어요.
          다 중요해 보이는데, 다 지금 당장 해야 할 것 같았습니다. 정작
          하루를 마치고 나면 뭘 했는지도 잘 기억나지 않는 날들이 많았어요.
        </p>

        <p>
          그러다 다시 꺼내 본 게 아이젠하워 매트릭스였습니다. 일을
          <span className="font-medium text-neutral-900">
            {" "}
            긴급함
          </span>과{" "}
          <span className="font-medium text-neutral-900">중요함</span> 두
          축으로 나눠보는 것만으로도, 머릿속이 훨씬 정리됐어요. 그런데
          시중의 도구들은 너무 복잡하거나, 반대로 너무 단순해서 이 매트릭스에
          맞게 쓰기가 불편했습니다. 그래서 직접 만들기로 했습니다.
        </p>

        <p>
          NEMO PLAN은 그렇게 시작됐습니다. 할 일을 적으면 AI가 초안으로
          긴급도와 중요도를 나눠주고, 저는 그걸 다시 확인하며 하루의 순서를
          정합니다. 거창한 기능보다, 매일 아침 &ldquo;오늘 뭐부터 해야
          하지&rdquo;라는 질문에 빠르게 답을 주는 도구를 목표로 만들고
          있어요.
        </p>

        <p>
          지금은 제가 가장 먼저, 가장 오래 쓰는 사용자입니다. 여러 프로젝트를
          혼자 굴리면서 느낀 불편함을 하나씩 기능으로 옮기고 있고, 앞으로도
          그 방식으로 다듬어갈 예정입니다.
        </p>
      </div>

      <footer className="mt-16 border-t border-neutral-200 pt-6 text-sm text-neutral-500">
        문의나 피드백은{" "}
        <a
          href="mailto:ch17215@naver.com"
          className="underline underline-offset-2 hover:text-neutral-700"
        >
          ch17215@naver.com
        </a>
        으로 보내주세요.
      </footer>
    </main>
  );
}
