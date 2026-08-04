import type { Metadata } from "next";
import ArticleLayout from "../_components/ArticleLayout";

export const metadata: Metadata = {
  title: "하루를 시작하기 전 5분 루틴 | NEMO PLAN",
  description:
    "출근 전이든, 책상 앞에 앉은 직후든, 하루의 순서를 정하는 데 걸리는 시간은 5분이면 충분합니다.",
};

export default function Page() {
  return (
    <ArticleLayout
      title="하루를 시작하기 전 5분 루틴"
      date="2026.08.04"
      readTime="3분"
    >
      <p>
        편의점을 운영할 때는 하루의 순서가 몸에 배어 있었어요. 문 열고,
        발주 확인하고, 진열대를 채우고. 따로 계획할 필요가 없었습니다.
        여러 프로젝트를 혼자 굴리기 시작하면서는 이 &ldquo;몸에 밴
        순서&rdquo;가 사라졌어요. 그래서 억지로라도 매일 아침 5분을
        떼어 순서를 정하는 루틴을 만들었습니다.
      </p>

      <h2 className="pt-2 text-lg font-semibold text-neutral-900">
        1분 — 어제 못 끝낸 일 확인
      </h2>
      <p>
        어제 하려다 못한 일이 있다면 오늘 목록 맨 위로 옮깁니다. 새로운
        일에 밀려 계속 미뤄지는 걸 막기 위한 최소한의 장치예요.
      </p>

      <h2 className="pt-2 text-lg font-semibold text-neutral-900">
        2분 — 오늘 들어온 새 할 일 적기
      </h2>
      <p>
        메일, 메시지, 머릿속에 떠오른 일들을 일단 전부 적습니다. 이
        단계에서는 순서를 고민하지 않아요. 먼저 다 꺼내놓는 게
        목적입니다.
      </p>

      <h2 className="pt-2 text-lg font-semibold text-neutral-900">
        1분 — 긴급함과 중요함으로 나누기
      </h2>
      <p>
        적어놓은 목록을 훑으면서 각 항목이 긴급한지, 중요한지만
        빠르게 표시합니다. 완벽하게 분류하려 하지 마세요. 첫 느낌으로
        충분합니다.
      </p>

      <h2 className="pt-2 text-lg font-semibold text-neutral-900">
        1분 — 오늘의 첫 번째 할 일 정하기
      </h2>
      <p>
        긴급하고 중요한 항목 중에서 딱 하나를 오늘의 첫 일로 정합니다.
        나머지는 그 하나를 끝낸 뒤에 다시 보기로 하고요.
      </p>

      <p>
        이 루틴의 핵심은 완벽한 계획을 세우는 게 아니라, 시작하기 전에
        방향을 한 번은 점검한다는 데 있어요. NEMO PLAN을 만든 것도 결국
        이 5분을 더 짧고 가볍게 만들기 위해서였습니다. 어제 못 끝낸 일과
        오늘 새로 들어온 일이 한 화면에서 바로 보이면, 이 루틴이
        훨씬 빨라지거든요.
      </p>
    </ArticleLayout>
  );
}
