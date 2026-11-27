# 천지영 포트폴리오

[사이트](https://behaviodd.github.io/) · [배포 기록](https://github.com/behaviodd/behaviodd.github.io/actions) · [다음 작업 인수인계](docs/HANDOFF.md)

## 어디를 수정하나요?

| 수정할 내용 | 파일 |
| --- | --- |
| profile의 디자인 철학, 경력, LinkedIn | [_data/about.yml](_data/about.yml) |
| Work 상세 글과 노출 순서 | [_work/](_work/)의 Markdown 파일. `order`가 작은 순서로 표시됩니다. |
| AI Projects 상세 글 | [_posts/](_posts/)의 `연-월-일-slug.md` 파일 |
| AI Projects 썸네일, 제목, 노출 순서 | [_data/ai_projects.yml](_data/ai_projects.yml). 배열 순서가 목록 순서입니다. |
| 프로젝트 이미지 | [Work 이미지](assets/work/) · [AI 썸네일](assets/ai-covers/) · [블로그 본문 이미지](assets/images/) |
| 화면 스타일 | [assets/css/portfolio.css](assets/css/portfolio.css) |

Work를 추가할 때는 기존 글을 복사해 파일명, 제목, 순서, 표지 경로와 대체 텍스트를 바꾸고 본문을 작성합니다. AI 작업기를 추가할 때는 글의 파일명에서 날짜를 뺀 부분을 목록의 `slug`와 일치시키세요. 메인은 두 목록에서 자동으로 구성됩니다. 이미지는 저장소 안에 두면 다른 PC에서도 함께 내려받을 수 있습니다.

## 다른 PC에서 시작하기

글만 수정할 때는 GitHub에서 위 파일을 열고 연필 버튼으로 편집할 수 있습니다. 변경 사항이 `main`에 반영되면 GitHub Pages가 사이트를 배포합니다.

로컬에서 화면을 확인하며 작업하려면 Git과 [.ruby-version](.ruby-version)에 적힌 Ruby를 준비합니다. Windows에서는 WSL의 Ubuntu 터미널에서 같은 명령을 사용할 수 있습니다.

```sh
git clone https://github.com/behaviodd/behaviodd.github.io.git
cd behaviodd.github.io
gem install bundler -v 4.0.3
bundle install
bundle exec jekyll serve
```

[로컬 미리보기](http://localhost:4000/)를 열면 수정한 글을 확인할 수 있습니다. 이미 복제한 PC에서는 작업 전에 `git pull --ff-only`로 최신 변경을 받고, `Gemfile.lock`이 바뀌었다면 `bundle install`을 다시 실행합니다.

## 변경 사항 배포하기

1. `bundle exec jekyll build`로 빌드를 확인합니다.
2. `git status`로 파일을 확인하고 수정한 글과 이미지를 함께 커밋합니다.
3. `git push origin main`으로 올린 뒤 위 배포 기록과 실제 페이지를 확인합니다. 푸시하려면 저장소에 쓰기 권한이 있는 GitHub 계정이 필요합니다.

로컬 빌드는 [Gemfile.lock](Gemfile.lock)의 버전을 사용합니다. 공개 사이트는 이 저장소의 `main` 루트를 GitHub Pages의 기본 Jekyll 빌드로 배포합니다.
