# 블로그 작업 인수인계

작성일: 2026-11-27 (Asia/Seoul) · 다음 작업: 2026-11-28

## 최신 변경: PDF 삭제와 다국어 resume

- 사용자의 개인정보 삭제 요청에 따라 공개 Resume PDF와 링크를 제거했다. PDF가 포함된 과거 main 이력도 승인받아 재작성했고, 해당 PDF를 포함한 이전 Actions 배포 실행과 산출물도 삭제했다.
- `.gitignore`에 `assets/documents/*.pdf`를 추가했다. 개인 PDF를 다시 커밋하지 않는다. 원본은 사용자의 Downloads 폴더에만 있다.
- profile 메뉴는 resume로 변경했다. 한국어 `/resume/`, 영어 `/en/resume/`, 일본어 `/ja/resume/`를 제공한다. `/about/`, `/profile/`은 `/resume/`로 이동한다.
- `_data/resume.yml`에 세 언어의 소개·Philosophy·경력·스킬을 보관하고 `_layouts/resume.html`로 렌더링한다. 한국어 Philosophy는 PDF 원문을 그대로 옮겼으며 이메일·전화번호와 외부 포트폴리오 공유 링크는 포함하지 않았다.
- 상단의 언어 전환은 resume 페이지의 언어를 선택한다. works 아티클은 한국어 원문을 유지한다.
- works의 모든 원고 10개는 `_work/`에 있다. 각 원고 상단의 `title`, `card_title`, `cover`, `cover_alt`, `order`를 수정한다. 이전 상세 글 주소는 유지한다.
- 사이트 제목은 `CHEON JIYOUNG`이다. 카드와 resume에 스크롤 fade-in, 링크와 메뉴에 마이크로 모션을 적용했다. 모션 줄이기 설정을 지원한다.
- 과거 커밋 원본 주소의 GitHub 캐시는 여전히 응답할 수 있다. GitHub Support 삭제 요청이 추가로 필요하다. 저장소 이력 정리는 GitHub 캐시와 타인의 다운로드 사본 삭제를 보장하지 않는다.
- 아래는 이전 세션 기록이다. PDF 제공 관련 옛 내용은 현재 상태에 적용하지 않는다.

## 현재 상태

- 저장소: `https://github.com/behaviodd/behaviodd.github.io`
- 작업 폴더: `/Users/alex/behaviodd.github.io` · 브랜치: `main`
- 공개 사이트: `https://behaviodd.github.io/`
- Jekyll 기반 포트폴리오. `main` 루트가 GitHub Pages 배포 대상이다.
- 사용자는 메뉴·폰트 변경 후 현재 수정 사항 전체를 커밋하고 푸시해 달라고 요청했다.
- 구체적인 다음 기능 요청은 아직 없다. 아래 확인 사항을 참고하고 다음 요청을 이어서 작업한다.

## 이번에 반영한 내용

### profile 메뉴와 Pretendard

- 주 메뉴의 `필로소피`를 소문자 `profile`로 변경했다. 페이지 제목과 H1도 동일하다.
- 실제 페이지 주소는 기존 `/about/`를 유지한다. `/profile/`은 `/about/`으로 이동하는 기존 리다이렉트를 유지한다.
- 공통 레이아웃, Digging Club, OAuth callback, 배송지 데모, 퇴근 계산기에 Pretendard 1.3.9 CDN 스타일시트를 적용했다.
- Inter·Helvetica Neue·JetBrains Mono 우선 지정을 제거했다. 본문, 폼 입력, 코드 영역도 Pretendard를 사용한다. 이모지 전용 글리프는 기존 이모지 폰트를 사용한다.
- 시스템 폰트는 CDN 로딩 실패 시 대체 폰트다. 현재 웹폰트는 자체 호스팅이 아니다.

### 이전부터 남아 있던 퇴근 계산기 수정

환경 세팅 당시 존재하던 미커밋 수정도 사용자의 전체 커밋 요청에 따라 포함했다. 커밋: `be3aa64`.

- 핵심 입력을 남은 인정근무시간·출근 시간으로 정리하고, 세부 조정과 다른 시나리오는 접힘 영역으로 옮겼다.
- `FieldLabel.tsx`의 설명 버튼과 입력 도움말을 추가했다.
- 국가를 IP API → 브라우저 로캘 → KR 순으로 추정하고, 국가별 공휴일을 조회한다.
- 매시간·탭 복귀 시 현재 날짜를 갱신한다.
- React 소스와 실제 배포본 `work-hours/`를 함께 커밋했다. Pretendard 변경도 포함한다.

## 내일 시작하기

```sh
cd /Users/alex/behaviodd.github.io
git status --short --branch
git pull --ff-only
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
bundle check
bundle exec jekyll serve --host 127.0.0.1 --port 4000
```

- 미리보기: `http://127.0.0.1:4000/`. 파일 수정 시 자동으로 다시 빌드된다.
- 서버는 이전 에이전트 세션 종료 후 꺼질 수 있다. 주소가 열리지 않으면 위 명령으로 다시 실행한다.
- 이미 4000번 포트에서 실행 중이면 기존 서버를 사용한다.
- macOS 기본 `/usr/bin/ruby`는 2.6.10이다. 위 PATH 설정을 생략하면 잘못된 Ruby/Bundler가 실행될 수 있다.
- 이 PC에서 확인한 Ruby는 Homebrew 4.0.4, 저장소 `.ruby-version`은 4.0.1이다. `Gemfile.lock`의 Bundler는 4.0.3이며 해당 의존성은 `vendor/bundle`에 설치했다.
- `bundle check`에서 누락이 나오면 같은 PATH 환경에서 `bundle install`한다.
- 에이전트 샌드박스에서 의존성 다운로드나 서버 포트 바인딩이 차단될 경우 해당 명령의 실행 권한이 필요하다.

## 수정 위치

| 작업 | 파일 |
| --- | --- |
| 메뉴·공통 폰트 로딩 | `_layouts/default.html` |
| 공통 스타일·본문 및 코드 폰트 | `assets/css/portfolio.css` |
| profile 화면·내용 | `about/index.html`, `_data/about.yml` |
| Work 상세 | `_work/` |
| AI Projects 글·목록 | `_posts/`, `_data/ai_projects.yml` |
| 작업기 작성 규칙 | `docs/POST_FORMAT.md` |
| Digging Club 폰트 | `_layouts/digging.html` |
| 퇴근 계산기 소스 | `work-hours-calculator/` |
| 퇴근 계산기 배포본 | `work-hours/` |

## 검증 결과와 다음 확인 사항

- `npm test --prefix work-hours-calculator`: 2개 파일, 13개 테스트 통과.
- `npm run build --prefix work-hours-calculator`: TypeScript 검사 및 Vite 빌드 통과.
- `bundle exec jekyll build`: 통과. `git diff --check`: 통과.
- 로컬 서버의 메인 페이지 HTTP 200 확인. 생성된 전체 HTML에서 Pretendard 스타일시트 로딩과 이전 Google Fonts 로더 제거를 확인했다.
- 브라우저 도구 연결이 불가해 실제 웹폰트 로딩과 모바일·데스크톱 배치는 육안 확인하지 못했다. 다음에는 메인, profile, Work 상세, AI Projects 글, Digging Club, 퇴근 계산기를 브라우저에서 확인하면 된다.
- 퇴근 계산기 테스트는 달력·계산 함수 중심이다. 국가 감지 API, 폼 상호작용과 날짜 변경 흐름의 브라우저 검증은 미완료다.
- 현재 국가별 공휴일 요청은 국가 변경 때만 실행된다. 열린 탭에서 연도가 바뀌면 공휴일 재조회가 필요할 수 있다. API 실패 시 KR은 내장 목록, 그 외 국가는 공휴일 없는 평일 기준을 사용한다.
- 푸시 후 GitHub Pages 배포 성공 여부는 저장소 Actions에서 확인한다. 로컬 빌드 성공과 공개 배포 성공은 별개다.

## 작업과 배포 시 주의

- 계산기를 수정하면 `npm run build --prefix work-hours-calculator`로 `work-hours/`를 다시 만들고 함께 커밋한다. 빌드가 오래된 해시 에셋을 교체하는 것은 정상이다.
- `_site/`, `.bundle/`, `vendor/`, `node_modules/`는 커밋하지 않는다.
- 환경 세팅 전의 미커밋 수정 백업은 이 PC의 `/Users/alex/behaviodd-backups/20261127-210406/`에 있다. Git 저장소에는 포함하지 않는다.
- 이 문서는 GitHub 저장소에 남기되 Jekyll 사이트에서는 제외하도록 `_config.yml`에 등록했다.
- 푸시 권한은 이번 요청에 대해 승인되었다. 다음 작업의 배포 여부는 그때의 사용자 요청을 따른다.

```sh
export PATH="/opt/homebrew/opt/ruby/bin:$PATH"
bundle exec jekyll build
git diff --check
git status --short --branch
# 변경 파일을 확인하고 필요한 파일만 스테이징·커밋한 뒤 푸시한다.
git push origin main
```
