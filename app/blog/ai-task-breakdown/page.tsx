import type { Metadata } from "next";
import ArticleLayout from "../_components/ArticleLayout";

export const metadata: Metadata = {
  title: "AI로 할일을 쪼개는 것의 장단점 | NEMO PLAN",
  description:
    "막연한 할 일을 AI가 작은 단위로 나눠줄 때 실제로 도움이 되는 경우와, 오히려 방해가 되는 경우를 구분해봅니다.",
};

export default function Page() {
  return (
    <ArticleLayout
      title="AI로 할일을 쪼개는 것의 장단점"
      date="2026.08.04"
      readTime="4분"
    >
      <p>
        &ldquo;앱 출시 준비하기&rdquo;라고 적어놓고 며칠째 그대로 두는
        경우가 있습니다. 할 일이 너무 크고 막연하면, 시작할 엄두가 나지
        않아요. 이럴 때 AI에게 &ldquo;이 일을 실행 가능한 단위로 나눠줘&rdquo;
        라고 물어보면 꽤 쓸만한 목록이 나옵니다. 저도 NEMO PLAN에 이
        기능을 넣었고, 실제로 자주 씁니다. 다만 언제 도움이 되고 언제
        오히려 방해가 되는지는 구분할 필요가 있어요.
      </p>

      <h2 className="pt-2 text-lg font-semibold text-neutral-900">
        도움이 되는 경우
      </h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          처음 해보는 유형의 일이라 어디서부터 시작할지 감이 안 잡힐 때
        </li>
        <li>
          일이 너무 커서 심리적으로 시작 자체가 부담스러울 때 — 작은
          단위로 쪼개면 첫 걸음의 문턱이 낮아집니다
        </li>
        <li>
          비슷한 일을 반복해서 처리해야 해서, 표준적인 절차를 빠르게
          참고하고 싶을 때
        </li>
      </ul>

      <h2 className="pt-2 text-lg font-semibold text-neutral-900">
        오히려 방해가 되는 경우
      </h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          이미 내 나름의 방식과 순서가 있는 일 — AI의 일반적인 답변이
          오히려 내 맥락을 놓칠 수 있어요
        </li>
        <li>
          판단이 핵심인 일 — 어떤 기능을 먼저 만들지, 어떤 고객을 먼저
          챙길지 같은 결정은 쪼개기보다 직접 고민하는 게 맞습니다
        </li>
        <li>
          AI가 만들어준 목록을 그대로 따르느라, 정작 그 일을 왜 하는지
          잊어버릴 때 — 쪼개진 하위 항목에 매몰돼 큰 그림을 놓치는
          경우예요
        </li>
      </ul>

      <p>
        결국 AI의 작업 분해는 &ldquo;시작을 도와주는 도구&rdquo;로 쓸 때
        가장 유용하다고 느낍니다. 나온 목록을 그대로 실행하기보다,
        한 번은 훑어보고 내 상황에 맞게 순서나 항목을 조정하는 과정을
        거치는 게 좋아요. NEMO PLAN에서도 AI가 제안한 하위 작업을 자유롭게
        수정하거나 삭제할 수 있게 만든 이유가 여기에 있습니다.
      </p>
    </ArticleLayout>
  );
}
