import type { Metadata } from "next";
import ArticleLayout from "../_components/ArticleLayout";

export const metadata: Metadata = {
  title: "아이젠하워 매트릭스란 무엇인가 | NEMO PLAN",
  description:
    "긴급함과 중요함, 두 개의 축으로 할 일을 나누는 오래된 방법이 왜 지금도 유효한지 살펴봅니다.",
};

export default function Page() {
  return (
    <ArticleLayout
      title="아이젠하워 매트릭스란 무엇인가"
      date="2026.08.04"
      readTime="4분"
    >
      <p>
        아이젠하워 매트릭스는 미국의 34대 대통령 드와이트 아이젠하워가 남긴
        말에서 이름을 따온 할 일 정리법입니다. &ldquo;급한 일은 대개 중요하지
        않고, 중요한 일은 대개 급하지 않다&rdquo;는 문장이 이 방법의 출발점이
        에요. 방법 자체는 단순합니다. 할 일을 &ldquo;긴급함&rdquo;과
        &ldquo;중요함&rdquo; 두 축으로 나눠서 네 칸으로 분류하는 것뿐이에요.
      </p>

      <p>네 칸은 각각 이렇게 나뉩니다.</p>

      <ul className="list-disc space-y-2 pl-5">
        <li>
          <span className="font-medium text-neutral-900">
            긴급하고 중요한 일
          </span>{" "}
          — 지금 당장 처리해야 하는 일. 마감이 오늘인 업무, 갑자기 터진
          문제 등이 여기 해당합니다.
        </li>
        <li>
          <span className="font-medium text-neutral-900">
            긴급하지 않지만 중요한 일
          </span>{" "}
          — 장기적으로 가장 가치 있는 일. 새로운 기술을 배우거나, 사업의
          방향을 고민하는 일처럼 미루기 쉽지만 미뤄서는 안 되는 일이에요.
        </li>
        <li>
          <span className="font-medium text-neutral-900">
            긴급하지만 중요하지 않은 일
          </span>{" "}
          — 다른 사람의 요청, 형식적인 회신처럼 급하게 느껴지지만 내
          목표와는 거리가 있는 일이에요.
        </li>
        <li>
          <span className="font-medium text-neutral-900">
            긴급하지도 중요하지도 않은 일
          </span>{" "}
          — 습관적으로 하게 되는 일. 과감히 줄이거나 없애도 되는 영역입니다.
        </li>
      </ul>

      <p>
        이 방법이 특별한 건 아니에요. 이미 수십 년 전부터 쓰여온 방식이고,
        지금도 수많은 생산성 책과 강의에서 반복해서 다뤄집니다. 그런데도 여전히
        유효한 이유는, 사람이 &ldquo;급함&rdquo;과 &ldquo;중요함&rdquo;을
        혼동하는 경향이 좀처럼 사라지지 않기 때문이에요. 알림이 울리면
        중요하지 않아도 반응하게 되고, 조용히 쌓여가는 중요한 일은 계속
        뒤로 밀리기 쉽습니다.
      </p>

      <p>
        저는 여러 프로젝트를 혼자 운영하면서 이 매트릭스를 다시 꺼내 봤어요.
        머릿속으로 분류하는 건 금방 잊히더라고요. 그래서 이 분류 자체를
        도구로 만든 게 NEMO PLAN입니다. 할 일을 적으면 네 칸 중 어디에
        속하는지 스스로 판단해보고, 필요하면 AI의 초안 제안도 참고할 수
        있게 만들었어요.
      </p>
    </ArticleLayout>
  );
}
