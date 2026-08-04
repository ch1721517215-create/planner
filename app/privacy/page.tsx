import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 | NEMO PLAN",
  description: "NEMO PLAN 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <header className="mb-12 border-b border-neutral-200 pb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          NEMO PLAN 개인정보처리방침
        </h1>
        <p className="mt-3 text-sm text-neutral-500">시행일자: 2026년 8월 4일</p>
      </header>

      <div className="space-y-12 text-neutral-700">
        <p className="leading-relaxed">
          NEMO PLAN(이하 &ldquo;서비스&rdquo;)은 이용자의 개인정보를 소중히
          다루며, 관련 법령에 따라 개인정보를 안전하게 관리하기 위해 다음과
          같이 개인정보처리방침을 수립·공개합니다.
        </p>

        <Section number="01" title="수집하는 개인정보 항목">
          <p>서비스는 회원가입 및 서비스 제공을 위해 다음 정보를 수집합니다.</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <span className="font-medium text-neutral-900">필수 항목:</span>{" "}
              이메일 주소, 비밀번호(암호화 저장)
            </li>
            <li>
              <span className="font-medium text-neutral-900">
                서비스 이용 중 생성되는 정보:
              </span>{" "}
              등록한 할일(Task) 데이터, 우선순위 분류 정보, 완료 기록, 통계
              데이터
            </li>
            <li>
              <span className="font-medium text-neutral-900">
                자동 수집 정보:
              </span>{" "}
              접속 로그, 쿠키, 접속 IP, 기기 정보, 서비스 이용 기록
            </li>
          </ul>
        </Section>

        <Section number="02" title="개인정보 수집 방법">
          <ul className="list-disc space-y-2 pl-5">
            <li>회원가입 및 서비스 이용 과정에서 이용자가 직접 입력</li>
            <li>서비스 이용 과정에서 자동으로 생성되어 수집</li>
          </ul>
        </Section>

        <Section number="03" title="개인정보의 이용 목적">
          <p>수집한 개인정보는 다음 목적을 위해 이용됩니다.</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>회원 인증 및 계정 관리</li>
            <li>
              할일 관리, 아이젠하워 매트릭스 분류, 통계 제공 등 핵심 서비스
              기능 제공
            </li>
            <li>AI 기반 작업 분해 기능 제공을 위한 입력 데이터 처리</li>
            <li>서비스 개선 및 신규 기능 개발을 위한 이용 패턴 분석</li>
            <li>부정 이용 방지 및 서비스 안정성 확보</li>
          </ul>
        </Section>

        <Section number="04" title="개인정보의 보유 및 이용 기간">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              회원 탈퇴 시 지체 없이 파기합니다. 단, 관계 법령에 따라 보존이
              필요한 경우 해당 기간 동안 보관합니다.
            </li>
            <li>
              서비스 이용 기록은 회원 탈퇴 또는 데이터 삭제 요청 시까지
              보관됩니다.
            </li>
          </ul>
        </Section>

        <Section number="05" title="개인정보의 제3자 제공 및 처리위탁">
          <p>
            서비스는 원활한 운영을 위해 아래와 같은 외부 서비스를 이용하며,
            이 과정에서 개인정보가 해당 서비스에 위탁·저장될 수 있습니다.
          </p>
          <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">위탁받는 자</th>
                  <th className="px-4 py-3 font-medium">위탁 업무 내용</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    Supabase
                  </td>
                  <td className="px-4 py-3">회원 인증, 데이터베이스 저장 및 관리</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    Groq
                  </td>
                  <td className="px-4 py-3">
                    AI 기반 작업 분해(Task Decomposition) 기능 처리
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    Vercel
                  </td>
                  <td className="px-4 py-3">웹사이트 호스팅 및 배포</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4">
            이용자의 동의 없이 개인정보를 제3자에게 제공하지 않으며, 법령에
            특별한 규정이 있는 경우에만 예외로 합니다.
          </p>
        </Section>

        <Section number="06" title="쿠키(Cookie)의 사용 및 광고 관련 안내">
          <p>
            서비스는 이용자에게 맞춤형 서비스를 제공하기 위해 쿠키를 사용할
            수 있습니다.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으며, 이
              경우 서비스 이용에 일부 제한이 있을 수 있습니다.
            </li>
            <li>
              서비스는 Google을 포함한 제3자 광고 사업자의 광고를 게재할 수
              있으며, 이들 사업자는 이용자의 서비스 방문 기록 등을 기반으로
              쿠키를 사용해 광고를 제공할 수 있습니다.
            </li>
            <li>
              이용자는{" "}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
              >
                Google 광고 설정(Ads Settings)
              </a>
              에서 맞춤형 광고 수신을 거부할 수 있습니다.
            </li>
          </ul>
        </Section>

        <Section number="07" title="이용자의 권리와 행사 방법">
          <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>본인의 개인정보 열람, 정정, 삭제 요청</li>
            <li>회원 탈퇴 및 개인정보 처리 정지 요청</li>
            <li>아래 연락처를 통한 문의</li>
          </ul>
        </Section>

        <Section number="08" title="개인정보의 안전성 확보 조치">
          <ul className="list-disc space-y-2 pl-5">
            <li>비밀번호 암호화 저장</li>
            <li>데이터베이스 접근 권한 관리(Row Level Security 적용)</li>
            <li>정기적인 보안 점검</li>
          </ul>
        </Section>

        <Section number="09" title="아동의 개인정보 보호">
          <p>
            본 서비스는 만 14세 미만 아동을 대상으로 하지 않으며, 만 14세
            미만 아동의 개인정보를 고의로 수집하지 않습니다.
          </p>
        </Section>

        <Section number="10" title="개인정보처리방침의 변경">
          <p>
            본 방침은 법령, 정책 또는 서비스 변경에 따라 개정될 수 있으며,
            변경 시 서비스 내 공지를 통해 안내합니다.
          </p>
        </Section>

        <Section number="11" title="문의처">
          <p>개인정보 관련 문의사항은 아래 연락처로 문의해 주시기 바랍니다.</p>
          <p className="mt-3">
            <span className="font-medium text-neutral-900">이메일:</span>{" "}
            <a
              href="mailto:ch17215@naver.com"
              className="underline underline-offset-2 hover:text-neutral-600"
            >
              ch17215@naver.com
            </a>
          </p>
        </Section>
      </div>

      <footer className="mt-16 border-t border-neutral-200 pt-6 text-xs text-neutral-400">
        본 문서는 NEMO PLAN 서비스 운영 형태에 맞춰 작성되었습니다.
      </footer>
    </main>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-baseline gap-3 text-lg font-semibold text-neutral-900">
        <span className="text-sm font-normal text-neutral-400">{number}</span>
        {title}
      </h2>
      <div className="mt-3 leading-relaxed">{children}</div>
    </section>
  );
}
