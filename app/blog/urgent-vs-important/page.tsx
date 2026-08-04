import type { Metadata } from "next";
import ArticleLayout from "../_components/ArticleLayout";

export const metadata: Metadata = {
  title: "긴급한 일과 중요한 일을 구분하는 법 | NEMO PLAN",
  description:
    "매일 밀려드는 할 일 중에서 정말 먼저 해야 할 일을 가려내는 실전 기준을 정리했습니다.",
};

export default function Page() {
  return (
    <ArticleLayout
      title="긴급한 일과 중요한 일을 구분하는 법"
      date="2026.08.04"
      readTime="5분"
    >
      <p>
        머리로는 &ldquo;중요한 일부터 해야지&rdquo; 생각하면서도, 막상
        하루를 시작하면 눈앞의 급한 일부터 처리하게 됩니다. 이건 의지력의
        문제가 아니라, 판단 기준이 흐릿하기 때문일 때가 많아요. 아래 세
        가지 질문을 스스로에게 던져보면 분류가 훨씬 쉬워집니다.
      </p>

      <h2 className="pt-2 text-lg font-semibold text-neutral-900">
        질문 1. 지금 안 하면 오늘 안에 문제가 생기는가
      </h2>
      <p>
        답이 &ldquo;그렇다&rdquo;면 긴급한 일입니다. 답이
        &ldquo;아니다, 며칠은 괜찮다&rdquo;라면 긴급하지 않은 일이에요.
        여기서 흔히 하는 착각은, 누군가 재촉한다고 해서 무조건 긴급하다고
        판단하는 거예요. 상대방의 재촉과 실제 마감은 다른 문제입니다.
      </p>

      <h2 className="pt-2 text-lg font-semibold text-neutral-900">
        질문 2. 이 일이 한 달 뒤, 1년 뒤의 나에게 영향을 주는가
      </h2>
      <p>
        답이 &ldquo;그렇다&rdquo;면 중요한 일입니다. 새로운 기능을
        기획하거나, 사업 구조를 다시 짜는 일처럼요. 답이 &ldquo;별로
        영향이 없다&rdquo;면 중요하지 않은 일일 가능성이 높아요. 단순
        회신, 반복 업무 같은 것들이 여기 속합니다.
      </p>

      <h2 className="pt-2 text-lg font-semibold text-neutral-900">
        질문 3. 이 일을 미루면 누가 손해를 보는가
      </h2>
      <p>
        내가 손해를 본다면 중요한 일에 가깝고, 다른 사람의 편의만
        떨어진다면 중요하지 않은 일에 가까울 때가 많습니다. 물론 예외는
        있지만, 이 질문만으로도 &ldquo;남의 급함&rdquo;에 끌려다니는 걸
        어느 정도 막을 수 있어요.
      </p>

      <p>
        세 질문을 한 번에 적용하기 어렵다면, 하루 중 딱 한 가지 일에만
        먼저 적용해보세요. 오늘 처리한 일 중 가장 오래 붙잡고 있던 일을
        떠올리고, 이 질문들을 던져보는 거예요. 대부분은 &ldquo;긴급해
        보였지만 사실 중요하지는 않았던 일&rdquo;이라는 걸 발견하게
        됩니다.
      </p>

      <p>
        저는 이 판단을 매번 새로 하는 게 피곤해서, NEMO PLAN에 할 일을
        적을 때 이 세 질문을 참고해 AI가 먼저 초안 분류를 해주도록
        만들었어요. 그 초안이 늘 맞는 건 아니지만, 적어도 텅 빈 화면
        앞에서 매번 처음부터 고민하지 않아도 되는 것만으로 확실히 도움이
        됩니다.
      </p>
    </ArticleLayout>
  );
}
