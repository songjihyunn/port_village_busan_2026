# 포트빌리지 부산 2026 - 스태프 운영 시스템

## 개요
2026년 부산항 일대 4,300평, 23개 구역에서 진행된 
대규모 페스티벌을 위한 스태프 운영 웹 애플리케이션.
50명 스태프, 6개 역할군(입장/F&B/마켓/팝업/무대/시설) 대상.

※ 미래내일 일경험 프로젝트형 프로그램의 결과물로 개발, 
Vercel 배포 완료. (실제 운영 사용 여부는 미확인 — 이 문장 꼭 넣기)

## 라이브 데모
[https://port-village-busan-2026.vercel.app]

## 주요 기능
- SVG 기반 인터랙티브 실내 지도 (23개 구역)
- 실시간 혼잡도 대시보드 (4단계 임계값, PostgreSQL 트리거)
- Three.js 360도 파노라마 뷰어 (구역별)
- 정규화된 동선 데이터 스키마

## 기술 스택
Next.js / TypeScript / Supabase (PostgreSQL) / Three.js / Vercel

## 아키텍처
flowchart TD
    subgraph Client["브라우저"]
        A["스태프 페이지<br/>/staff/[role]"]
        B["관리자 대시보드<br/>/admin"]
    end

    subgraph NextApp["Next.js App (Vercel 배포)"]
        direction TB
        C["MapTab.tsx<br/>SVG 인터랙티브 실내지도<br/>(23개 구역)"]
        D["PanoramaViewer.tsx<br/>Three.js 360° 파노라마"]
        E["DashboardTab.tsx<br/>실시간 혼잡도 대시보드"]
        F["StaffTab / ManualTab<br/>TrainingTab"]
        G["lib/supabase<br/>client.ts · server.ts"]
    end

    subgraph DB["Supabase (PostgreSQL)"]
        direction TB
        H[("staff<br/>50명 · 6개 역할군")]
        I[("zone_congestion")]
        R[("route_data → route_items<br/>→ route_steps → route_paths<br/>→ route_path_zones → route_path_waypoints")]
        K[("alerts / checklist_items<br/>training_notifications / quiz_results")]
        L{{"congestion_level_trigger<br/>4단계 임계값 자동 계산<br/>(<20% / 40~79% / 80~89% / 90%+)"}}
    end

    A --> C
    A --> D
    B --> E
    B --> F
    C --> G
    D --> G
    E --> G
    F --> G
    G --> H
    G --> I
    G --> R
    G --> K
    I -- INSERT/UPDATE --> L
    L -- 자동 갱신 --> I


## 트러블슈팅
- Supabase 중첩 쿼리 에러 해결 과정
- SVG 좌표 정렬 이슈
- (리팩토링 하면) RoleDetailPage.tsx 900줄 → 분리 과정

## 스크린샷
[이미지 3~5장]
