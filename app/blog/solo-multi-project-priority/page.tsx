import type { Metadata } from "next";
import ArticleLayout from "../_components/ArticleLayout";

export const metadata: Metadata = {
  title: "1인 프로젝트를 여러 개 굴릴 때의 우선순위 관리 | NEMO PLAN",
  description:
    "혼자서 여러 프로젝트를 동시에 진행할 때 흔히 겪는 우선순위 혼란과, 이를 정리하는 방법을 다룹니다.",
};

export default function Page() {
  return (
    <ArticleLayout
      title="1인 프로젝트를 여러 개 굴릴 때의 우선순위 관리"
      date="2026.08.04"
      readTime="5분"
    >
      <p>
        회사에 다니면 우선순위를 정해주는 사람이 있습니다. 팀장이, 고객이,
        마감이 순서를 대신 정해주니까요. 혼자 여러 프로젝트를 진행하면 이
        구조가 통째로 사라집니다. 어떤 프로젝트를 오늘 붙잡을지, 어떤 걸
        미룰지 전부 스스로 정해야 해요. 이게 생각보다 훨씬 피곤한
        일입니다.
      </p>

      <h2 className="pt-2 text-lg font-semibold text-neutral-900">
        흔히 겪는 세 가지 함정
      </h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <span className="font-medium text-neutral-900">
            재미있는 프로젝트만 계속 붙잡기
          </span>{" "}
          — 새로 시작한 프로젝트는 신선해서 자꾸 손이 가고, 오래된
          프로젝트는 지루해서 자꾸 미루게 됩니다.
        </li>
        <li>
          <span className="font-medium text-neutral-900">
            모든 프로젝트를 조금씩 매일 건드리기
          </span>{" "}
          — 골고루 신경 쓰는 것 같지만, 실제로는 어느 것도 제대로 끝내지
          못하는 상태가 되기 쉽습니다.
        </li>
        <li>
          <span className="font-medium text-neutral-900">
            급한 연락이 오는 프로젝트에만 반응하기
          </span>{" "}
          — 고객 문의나 알림이 오는 프로젝트가 자연스레 우선순위를
          가져가버립니다. 정작 중요한 건 조용히 뒤로 밀리고요.
        </li>
      </ul>

      <h2 className="pt-2 text-lg font-semibold text-neutral-900">
        제가 쓰는 방식
      </h2>
      <p>
        저는 매일 아침 프로젝트별로 &ldquo;오늘 이 프로젝트에서 딱 하나만
        한다면 뭘 할까&rdquo;를 먼저 정합니다. 그리고 그 항목들을 전부
        아이젠하워 매트릭스에 올려서, 어느 프로젝트의 일이 진짜
        긴급하고 중요한지 한눈에 비교합니다. 프로젝트 단위가 아니라
        &ldquo;오늘 할 일&rdquo; 단위로 비교하면, 신선함이나 재미가 아니라
        실제 중요도로 순서를 정할 수 있어요.
      </p>

      <p>
        이 방식이 잘 맞아서, NEMO PLAN에는 처음부터 프로젝트나 카테고리를
        구분하는 기능보다 &ldquo;오늘의 할 일을 한 매트릭스 위에서 함께
        보기&rdquo;를 우선으로 넣었습니다. 여러 일을 동시에 붙잡고 있는
        분들이라면, 일단 프로젝트별로 나누기 전에 오늘 할 일을 전부
        한곳에 모아 비교해보는 것부터 추천드려요.
      </p>
    </ArticleLayout>
  );
}
