---
layout: project
title: 글로벌 배송에서 가장 중요한 것
company: 메이크스타
order: 1
cover: /assets/work/address-ko-zh.svg
zoom_cover: true
show_card_description: true
cover_alt: 배송지 등록 화면의 국문과 중문 예시. 같은 위치에서 배송 국가를 고른 뒤 현지 주소를 입력합니다.
description: 한국에서는 도로명을 검색하고, 중국에서는 성·시·구를 고릅니다. 어느 나라에서 주문하든 익숙한 방식으로 주소를 쓰고, 그 주소가 송장에 어떻게 찍힐지 직접 확인할 수 있도록 배송지 입력 과정을 설계했습니다.
---

## 문제 정의

물류팀은 주소가 중간에 잘린 주문을 받으면 고객이 처음에 쓴 주소부터 다시 찾아야 했습니다. 원래 주문을 보고도 짐작하기 어려우면 고객에게 다시 물었습니다. 그대로 발송했다가 반송되면 물류비가 두 배로 드는 경우도 있었습니다.

당시 가장 답답했던 건 중화권과 일본 주문에서 같은 오류가 계속 나온다는 점이었습니다. 현지 지명을 영어로 옮기다가 철자가 틀리기도 했고, 주소 검색으로 이미 들어간 지역명을 고객이 상세주소에 한 번 더 쓰기도 했습니다. 같은 지명이 두 번 들어가 주소가 길어지면 물류관리시스템(WMS)의 글자 수 제한에 걸려 뒤가 잘렸습니다.

<!-- 기존 배송지 입력 화면을 제공받으면 여기에 추가합니다. -->

## 어디까지 직접 써야 할까

제가 제일 먼저 줄이고 싶었던 건 고객이 직접 타이핑하는 양이었습니다. 특히 성이나 시처럼 이미 목록이 있는 지명을 굳이 영어로 써야 할 이유가 없었습니다. 그렇다고 모든 고객에게 같은 검색창을 줄 수도 없었습니다. 기존 주문서의 Google 주소 검색은 중국 본토에서 열리지 않았으니까요.

그래서 배송 국가를 먼저 받았습니다. 중국을 고르면 성·시·구가 차례로 나옵니다. 세 곳을 고르고 나면 첫 번째 상세주소 칸은 도로명과 번지, 두 번째 칸은 건물과 호실부터 쓰면 됩니다.

<figure class="design-detail">
  <a href="{{ '/assets/work/address-region.png' | relative_url }}" aria-label="성·시·구 선택란과 상세주소 입력 예시 원본 크게 보기"><img src="{{ '/assets/work/address-region.png' | relative_url }}" alt="성·시·구 선택란과 상세주소 입력 예시" loading="lazy"></a>
  <figcaption>중국 본토 배송지의 지역 선택과 직접 입력 항목</figcaption>
</figure>

같은 자리에 홍콩 고객에게는 건물명 검색을 뒀습니다. 건물을 찾으면 층과 호만 더하면 됩니다. 대만은 시·현과 구를 고르면 우편번호가 채워집니다. 일본에는 일본우정국의 우편번호 데이터를, 대만과 홍콩에는 현지 주소 API를 활용했습니다. 어느 나라에서 주문하든 고객이 할 일은 이미 아는 정보로 자기 주소를 찾고, 거기서 빠진 부분만 적는 것입니다.

## 내가 쓴 호실이 송장에도 있을까

입력을 줄이고 나니 한 가지가 남았습니다. 고객은 한자로 주소를 썼는데 물류팀이 받는 주소는 영어였습니다. 저는 변환된 지명을 입력란 바로 밑에 두었습니다. ‘深圳市’를 고르면 그 자리에서 ‘Shenzhen’을 볼 수 있습니다.

<figure class="design-detail">
  <a href="{{ '/assets/work/address-pinyin.png' | relative_url }}" aria-label="선택한 广东省 아래에 Guangdong, 深圳市 아래에 Shenzhen이 표시된 화면 원본 크게 보기"><img src="{{ '/assets/work/address-pinyin.png' | relative_url }}" alt="선택한 广东省 아래에 Guangdong, 深圳市 아래에 Shenzhen이 표시된 화면" loading="lazy"></a>
  <figcaption>입력란 바로 아래에서 확인하는 영문 지명</figcaption>
</figure>

마지막 확인은 주문서에서 합니다. 예를 들어 아래 화면에서 고객이 쓴 호실은 ‘A座1201室’입니다. 주소를 저장하고 나면 바로 아래 영문 주소의 첫머리에 ‘Room 1201, Block A’가 보입니다. 호실을 빠뜨렸다면 아직 주문서에 있는 동안 ‘변경’을 눌러 고칠 수 있습니다.

<figure class="design-detail">
  <a href="{{ '/assets/work/address-saved.png' | relative_url }}" aria-label="저장된 현지어 주소와 송장용 영문 주소가 함께 표시된 배송 정보 원본 크게 보기"><img src="{{ '/assets/work/address-saved.png' | relative_url }}" alt="저장된 현지어 주소와 송장용 영문 주소가 함께 표시된 배송 정보" loading="lazy"></a>
  <figcaption>주문 전에 대조하고 수정할 수 있는 최종 배송지</figcaption>
</figure>

## 결과

물류기획팀 집계에서 주소 오류가 가장 많았던 이벤트를 하나씩 꺼내 비교했습니다. 개선 전에는 한 이벤트에서 약 400건까지 나왔고, 개선 후에는 가장 많았던 이벤트가 약 30건이었습니다. 오류가 한 건도 없었던 이벤트도 있었습니다.

<figure style="margin: 1.5rem 0" aria-label="물류기획팀이 확인한 이벤트당 최대 주소 오류 건수. 이전 약 400건, 최근 약 30건.">
  <figcaption><strong>이벤트당 최대 주소 오류 건수</strong></figcaption>
  <div style="display:grid;grid-template-columns:2.5em 1fr 5em;align-items:center;gap:.65em;margin-top:1em">
    <span>이전</span><span aria-hidden="true" style="background:#edf0f2"><span style="display:block;width:100%;height:1.15em;background:#657487"></span></span><strong>약 400건</strong>
    <span>최근</span><span aria-hidden="true" style="background:#edf0f2"><span style="display:block;width:7.5%;height:1.15em;background:#176b64"></span></span><strong>약 30건</strong>
  </div>
</figure>

이 수치는 이벤트별 오류 건수입니다. 당시 집계에는 이벤트별 주문량이 없어 주문 대비 오류율까지는 알 수 없습니다.

## 배송지 입력해 보기

‘배송지’에서 ‘예시 배송지’를 고른 뒤 호실을 바꾸고 ‘수정하기’를 누르면, 주문서에 어떤 주소가 남는지 확인할 수 있습니다.

<iframe class="address-prototype" src="{{ '/assets/work/address-demo.html' | relative_url }}" title="국가별 배송지 입력 프로토타입"></iframe>
