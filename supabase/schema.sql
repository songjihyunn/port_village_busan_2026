-- =====================================================
-- Port Village Busan 2026 — Supabase Schema (Full)
-- =====================================================
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS checklist_items CASCADE;
DROP TABLE IF EXISTS quiz_results CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS training_notifications CASCADE;
DROP TABLE IF EXISTS zone_congestion CASCADE;
DROP TABLE IF EXISTS route_steps CASCADE;
DROP TABLE IF EXISTS route_items CASCADE;
DROP TABLE IF EXISTS route_data CASCADE;
DROP TABLE IF EXISTS route_path_waypoints CASCADE;
DROP TABLE IF EXISTS route_path_zones CASCADE;
DROP TABLE IF EXISTS route_paths CASCADE;

CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  role text NOT NULL CHECK (role IN ('entrance','fnb','market','popup','stage','facility')),
  zone text NOT NULL,
  shift_start text NOT NULL DEFAULT '09:00',
  shift_end text NOT NULL DEFAULT '18:00',
  is_trained boolean NOT NULL DEFAULT false,
  quiz_score integer,
  quiz_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  role text NOT NULL,
  score integer NOT NULL,
  total integer NOT NULL DEFAULT 7,
  answers jsonb NOT NULL DEFAULT '[]',
  completed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS zone_congestion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id text NOT NULL UNIQUE,
  zone_name text NOT NULL,
  current_count integer NOT NULL DEFAULT 0,
  capacity integer NOT NULL DEFAULT 500,
  level text NOT NULL DEFAULT 'low' CHECK (level IN ('low','medium','high','critical')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (current_count >= 0),
  CHECK (current_count <= capacity)
);

CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('emergency','warning','info')),
  zone_id text,
  message text NOT NULL,
  is_resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS training_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE CASCADE,
  message text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  task text NOT NULL,
  is_done boolean NOT NULL DEFAULT false,
  done_by text,
  done_at timestamptz,
  display_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS route_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('entrance','fnb','market','popup','stage','facility')),
  title text NOT NULL,
  description text NOT NULL
);

CREATE TABLE IF NOT EXISTS route_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_data_id uuid REFERENCES route_data(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  name text NOT NULL,
  note text
);

CREATE TABLE IF NOT EXISTS route_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_item_id uuid REFERENCES route_items(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  step text NOT NULL
);

CREATE TABLE IF NOT EXISTS route_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('entrance','fnb','market','popup','stage','facility')),
  display_order integer NOT NULL DEFAULT 0,
  label text NOT NULL,
  color text NOT NULL
);

CREATE TABLE IF NOT EXISTS route_path_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_path_id uuid REFERENCES route_paths(id) ON DELETE CASCADE,
  zone_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS route_path_waypoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_path_id uuid REFERENCES route_paths(id) ON DELETE CASCADE,
  path_index integer NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0,
  x integer NOT NULL,
  y integer NOT NULL
);

-- =====================================================
-- Seed: Zone Congestion
-- =====================================================
INSERT INTO zone_congestion (zone_id, zone_name, current_count, capacity, level) VALUES
  ('F1',  '동문식당가',                  150, 300, 'medium'),
  ('C1',  '수중광장(버블쇼)',            300, 500, 'medium'),
  ('F2',  '서문식당가',                  120, 300, 'medium'),
  ('M1',  '동문시장',                     60, 200, 'low'),
  ('FA1', '의무실·주민자치센터',           10,  30, 'medium'),
  ('M2',  '서문시장',                     70, 200, 'medium'),
  ('FA2', '파도비우소 (화장실·수유실)',     5,  30, 'low'),
  ('F3',  '푸드트럭존',                   10,  50, 'low'),
  ('FA3', '분리수거존(좌)',                5,  30, 'low'),
  ('F4',  'FOOD 부스 1',                 20, 100, 'low'),
  ('E1',  '출입구(좌)',                   60, 150, 'medium'),
  ('F5',  'FOOD 부스 2',                 20, 100, 'low'),
  ('F6',  'FOOD 부스 3',                 20, 100, 'low'),
  ('E2',  '출입구(우)',                   60, 150, 'medium'),
  ('FA4', '분리수거존(우)',                5,  30, 'low'),
  ('P1',  'BTS THE CITY ARIRANG BUSAN',  80, 200, 'medium'),
  ('C2',  '파도놀이터 (휴게 공간)',        40, 200, 'low'),
  ('FA5', '항구마을 우물(실외)',           5,  30, 'low'),
  ('M3',  '파도마당 (휴게 공간)',          60, 300, 'low'),
  ('F8',  '부산고메셀렉션',              170, 200, 'high'),
  ('C3',  '포트게더링',                  200, 250, 'high'),
  ('E3',  '입구',                        100, 500, 'low')
ON CONFLICT (zone_id) DO UPDATE
  SET current_count = EXCLUDED.current_count,
      capacity      = EXCLUDED.capacity,
      level         = EXCLUDED.level,
      updated_at    = now();

-- =====================================================
-- Seed: Staff (총 50명)
-- =====================================================
INSERT INTO staff (name, phone, role, zone, shift_start, shift_end, is_trained, quiz_score, quiz_completed_at) VALUES
  ('김민준', '010-1234-5678', 'entrance', '입구',                        '07:00', '15:00', true,  6, now() - interval '2 days'),
  ('이서연', '010-2345-6789', 'entrance', '입구',                        '07:00', '15:00', true,  7, now() - interval '1 day'),
  ('박지훈', '010-3456-7890', 'entrance', '출입구(좌)',                   '15:00', '22:00', false, null, null),
  ('최유진', '010-4567-8901', 'fnb',      '동문식당가',                  '08:00', '16:00', true,  5, now() - interval '3 days'),
  ('정다은', '010-5678-9012', 'fnb',      '서문식당가',                  '08:00', '16:00', true,  7, now() - interval '2 days'),
  ('한승우', '010-6789-0123', 'fnb',      'FOOD 부스 1',                '16:00', '22:00', false, null, null),
  ('오수빈', '010-7890-1234', 'market',   '동문시장',                    '09:00', '18:00', true,  6, now() - interval '1 day'),
  ('임재현', '010-8901-2345', 'market',   '서문시장',                    '09:00', '18:00', false, null, null),
  ('신혜린', '010-9012-3456', 'popup',    'BTS THE CITY ARIRANG BUSAN', '10:00', '20:00', true,  7, now() - interval '4 days'),
  ('강태양', '010-0123-4567', 'popup',    'BTS THE CITY ARIRANG BUSAN', '10:00', '20:00', true,  5, now() - interval '2 days'),
  ('윤채원', '010-1234-0987', 'stage',    '수중광장(버블쇼)',             '07:00', '22:00', true,  6, now() - interval '1 day'),
  ('류동현', '010-2345-1098', 'stage',    '포트게더링',                  '07:00', '22:00', false, null, null),
  ('백소영', '010-3456-2109', 'facility', '의무실·주민자치센터',          '08:00', '22:00', true,  7, now() - interval '3 days'),
  ('송민호', '010-4567-3210', 'facility', '파도비우소 (화장실·수유실)',   '08:00', '22:00', false, null, null),
  ('정준호', '010-5678-4321', 'entrance', '출입구(우)',                   '07:00', '15:00', true,  6, now() - interval '2 days'),
  ('이민석', '010-6789-5432', 'entrance', '입구',                        '15:00', '22:00', true,  5, now() - interval '1 day'),
  ('박현준', '010-7890-6543', 'fnb',      '푸드트럭존',                  '08:00', '16:00', false, null, null),
  ('최지은', '010-8901-7654', 'fnb',      '푸드트럭존',                  '16:00', '22:00', true,  6, now() - interval '2 days'),
  ('정수빈', '010-9012-8765', 'fnb',      'FOOD 부스 2',                '08:00', '16:00', true,  7, now() - interval '1 day'),
  ('한준영', '010-0123-9876', 'fnb',      'FOOD 부스 2',                '16:00', '22:00', false, null, null),
  ('오지훈', '010-1234-1111', 'fnb',      'FOOD 부스 2',                '08:00', '16:00', true,  5, now() - interval '3 days'),
  ('임현지', '010-2345-2222', 'fnb',      'FOOD 부스 2',                '16:00', '22:00', true,  6, now() - interval '1 day'),
  ('신재혁', '010-3456-3333', 'fnb',      'FOOD 부스 3',                '08:00', '16:00', false, null, null),
  ('강민준', '010-4567-4444', 'fnb',      'FOOD 부스 3',                '16:00', '22:00', true,  7, now() - interval '2 days'),
  ('윤서진', '010-5678-5555', 'fnb',      '부산고메셀렉션',              '08:00', '16:00', true,  6, now() - interval '1 day'),
  ('류지우', '010-6789-6666', 'fnb',      '부산고메셀렉션',              '16:00', '22:00', true,  5, now() - interval '2 days'),
  ('백준호', '010-7890-7777', 'market',   '파도마당 (휴게 공간)',         '09:00', '18:00', false, null, null),
  ('송혜빈', '010-8901-8888', 'market',   '파도마당 (휴게 공간)',         '09:00', '18:00', true,  6, now() - interval '3 days'),
  ('김태호', '010-9012-9999', 'market',   '파도마당 (휴게 공간)',         '09:00', '18:00', true,  7, now() - interval '1 day'),
  ('이준영', '010-0123-1010', 'popup',    'BTS THE CITY ARIRANG BUSAN', '10:00', '20:00', true,  5, now() - interval '2 days'),
  ('박수현', '010-1234-1112', 'popup',    'BTS THE CITY ARIRANG BUSAN', '10:00', '20:00', false, null, null),
  ('최영준', '010-2345-1212', 'stage',    '파도놀이터 (휴게 공간)',       '07:00', '22:00', true,  6, now() - interval '1 day'),
  ('정성훈', '010-3456-1313', 'stage',    '파도놀이터 (휴게 공간)',       '07:00', '22:00', true,  5, now() - interval '2 days'),
  ('한지호', '010-4567-1414', 'stage',    '포트게더링',                  '07:00', '22:00', false, null, null),
  ('오연주', '010-5678-1515', 'facility', '분리수거존(좌)',               '08:00', '22:00', true,  6, now() - interval '1 day'),
  ('임성준', '010-6789-1616', 'facility', '분리수거존(좌)',               '08:00', '22:00', true,  7, now() - interval '3 days'),
  ('신민경', '010-7890-1717', 'facility', '분리수거존(우)',               '08:00', '22:00', false, null, null),
  ('강지현', '010-8901-1818', 'facility', '분리수거존(우)',               '08:00', '22:00', true,  5, now() - interval '2 days'),
  ('윤지훈', '010-9012-1919', 'facility', '항구마을 우물(실외)',          '08:00', '22:00', true,  6, now() - interval '1 day'),
  ('류현지', '010-0123-2020', 'facility', '항구마을 우물(실외)',          '08:00', '22:00', true,  7, now() - interval '2 days'),
  ('한주호', '010-6666-7070', 'entrance', '입구',                        '15:00', '22:00', true,  5, now() - interval '2 days'),
  ('오소은', '010-7777-8080', 'entrance', '출입구(좌)',                   '07:00', '15:00', false, null, null),
  ('임영석', '010-8888-9090', 'entrance', '입구',                        '15:00', '22:00', true,  6, now() - interval '1 day'),
  ('김태희', '010-1111-2020', 'fnb',      'FOOD 부스 2',                '08:00', '16:00', true,  6, now() - interval '2 days'),
  ('이준혁', '010-2222-3030', 'fnb',      '동문식당가',                  '16:00', '22:00', true,  5, now() - interval '1 day'),
  ('박민수', '010-3333-4040', 'fnb',      'FOOD 부스 1',                '16:00', '22:00', false, null, null),
  ('최예진', '010-4444-5050', 'fnb',      '서문식당가',                  '08:00', '16:00', true,  7, now() - interval '2 days'),
  ('정준서', '010-5555-6060', 'fnb',      'FOOD 부스 2',                '08:00', '16:00', true,  6, now() - interval '1 day'),
  ('신태호', '010-9999-1010', 'facility', '의무실·주민자치센터',          '08:00', '22:00', true,  5, now() - interval '2 days'),
  ('강혜민', '010-0000-1111', 'facility', '파도비우소 (화장실·수유실)',   '08:00', '22:00', true,  7, now() - interval '3 days');

-- =====================================================
-- Seed: Checklist Items
-- =====================================================
INSERT INTO checklist_items (category, task, display_order) VALUES
  ('게이트', '메인게이트 QR 스캐너 작동 확인', 1),
  ('게이트', '비상 대피 안내판 설치 완료', 2),
  ('게이트', '입장 통제 바리케이드 설치', 3),
  ('F&B', '식품 냉장 온도 점검 완료', 4),
  ('F&B', 'POS 시스템 작동 확인', 5),
  ('F&B', '위생용품(장갑·마스크) 비치 확인', 6),
  ('안전', 'AED 작동 상태 확인', 7),
  ('안전', '소화기 위치 및 상태 확인', 8),
  ('안전', '의무실 응급물품 구비 확인', 9),
  ('무대', '음향·조명 장비 테스트 완료', 10),
  ('무대', '무대 안전 펜스 설치 확인', 11),
  ('통신', '무전기 배터리 충전 완료', 12),
  ('통신', '비상연락망 공유 완료', 13);

-- =====================================================
-- Seed: Alerts
-- =====================================================
INSERT INTO alerts (type, zone_id, message) VALUES
  ('warning', 'C1', '수중광장(버블쇼) 혼잡도 높음 — 입장 속도 조절 필요'),
  ('warning', 'C3', '포트게더링 혼잡도 높음 — 동선 분산 요청'),
  ('info', null, '오후 3시 메인 공연 시작 전 전원 대기 위치 확인');

-- =====================================================
-- Seed: Route Data (텍스트 동선)
-- =====================================================
DELETE FROM route_data;

-- entrance
WITH rd AS (
  INSERT INTO route_data (role, title, description) VALUES
    ('entrance', '입장통제 구역 동선', '관람객 입장·퇴장 흐름과 비상 시 대피 동선을 숙지하세요.')
  RETURNING id
),
ri AS (
  INSERT INTO route_items (route_data_id, display_order, name, note) VALUES
    ((SELECT id FROM rd), 1, '스태프 출근 동선',     '관람객 입장 전 07:00까지 배치 완료'),
    ((SELECT id FROM rd), 2, '관람객 입장 동선',     'E3이 유일한 입장 게이트 — 스탬프 날인 철저히'),
    ((SELECT id FROM rd), 3, 'E1·E2 내부 이동 동선', NULL),
    ((SELECT id FROM rd), 4, 'E3 혼잡 시 대응',      '수용 80% 초과 시 즉시 운영본부(#101) 보고'),
    ((SELECT id FROM rd), 5, '비상 대피 동선',       '화재·비상 시 게이트 전면 개방 후 외부 부두 광장으로 대피 유도')
  RETURNING id, display_order
)
INSERT INTO route_steps (route_item_id, display_order, step) VALUES
  ((SELECT id FROM ri WHERE display_order=1), 1, '외부 주차장 도착'),
  ((SELECT id FROM ri WHERE display_order=1), 2, 'E3 입구 옆 통로 진입'),
  ((SELECT id FROM ri WHERE display_order=1), 3, '담당 출입구(E1·E2·E3) 배치'),
  ((SELECT id FROM ri WHERE display_order=2), 1, 'E3 입구 — 손등 스탬프 날인'),
  ((SELECT id FROM ri WHERE display_order=2), 2, '야외 구역 진입 후 자유 이동'),
  ((SELECT id FROM ri WHERE display_order=2), 3, '실내 이동 시 E1·E2 통해 자유롭게 이동'),
  ((SELECT id FROM ri WHERE display_order=3), 1, 'E1(동문측) — 실내↔야외 자유 이동 게이트'),
  ((SELECT id FROM ri WHERE display_order=3), 2, 'E2(서문측) — 실내↔야외 자유 이동 게이트'),
  ((SELECT id FROM ri WHERE display_order=3), 3, '재입장 시 손등 스탬프 유무 확인'),
  ((SELECT id FROM ri WHERE display_order=4), 1, 'E3 혼잡 감지'),
  ((SELECT id FROM ri WHERE display_order=4), 2, '스탬프 날인 속도 조절 및 대기줄 외부 정리'),
  ((SELECT id FROM ri WHERE display_order=4), 3, '혼잡 지속 시 즉시 운영본부(#101) 보고'),
  ((SELECT id FROM ri WHERE display_order=5), 1, 'E3·E1·E2 게이트 전면 개방'),
  ((SELECT id FROM ri WHERE display_order=5), 2, '관람객 외부로 신속 대피 유도'),
  ((SELECT id FROM ri WHERE display_order=5), 3, '부두 외부 광장 집결');

-- fnb
WITH rd AS (
  INSERT INTO route_data (role, title, description) VALUES
    ('fnb', 'F&B 구역 동선', '식재료 입고부터 고객 서비스, 폐기물 처리 동선을 숙지하세요.')
  RETURNING id
),
ri AS (
  INSERT INTO route_items (route_data_id, display_order, name, note) VALUES
    ((SELECT id FROM rd), 1, '스태프 출근 동선',                     '식재료 냉장 온도(5°C↓) 확인 후 오픈 준비'),
    ((SELECT id FROM rd), 2, '식재료 입고 동선',                     '입고 시간: 오픈 2시간 전. 통로 차단 금지'),
    ((SELECT id FROM rd), 3, '실내 식당가 동선 (F1·F2)',             'FA1 의무실 인접 — 응급 상황 즉시 연락'),
    ((SELECT id FROM rd), 4, '야외 FOOD부스 동선 (F3~F6·F8)',        'FA3·FA4 분리수거존 인접 — 폐기물 2시간마다 처리'),
    ((SELECT id FROM rd), 5, '비상 대피 동선',                       '화재 발생 시 즉시 시설팀(#103) 신고 후 대피')
  RETURNING id, display_order
)
INSERT INTO route_steps (route_item_id, display_order, step) VALUES
  ((SELECT id FROM ri WHERE display_order=1), 1, '외부 주차장 도착'),
  ((SELECT id FROM ri WHERE display_order=1), 2, 'E3 옆 통로 진입'),
  ((SELECT id FROM ri WHERE display_order=1), 3, '담당 F&B 구역 배치'),
  ((SELECT id FROM ri WHERE display_order=2), 1, '외부 하역 구역'),
  ((SELECT id FROM ri WHERE display_order=2), 2, 'E3 옆 서비스 통로'),
  ((SELECT id FROM ri WHERE display_order=2), 3, '각 F&B 부스 보관소'),
  ((SELECT id FROM ri WHERE display_order=3), 1, '실내 좌측 동문식당가 F1'),
  ((SELECT id FROM ri WHERE display_order=3), 2, '중앙 수중광장 C1 기준 좌우 배치'),
  ((SELECT id FROM ri WHERE display_order=3), 3, '실내 우측 서문식당가 F2'),
  ((SELECT id FROM ri WHERE display_order=4), 1, 'F3 푸드트럭존 (좌단)'),
  ((SELECT id FROM ri WHERE display_order=4), 2, 'F4 → E1 게이트 옆 → F5'),
  ((SELECT id FROM ri WHERE display_order=4), 3, 'E2 게이트 옆 → F6(우단)'),
  ((SELECT id FROM ri WHERE display_order=4), 4, 'F8 부산고메셀렉션 (야외 우측 별도)'),
  ((SELECT id FROM ri WHERE display_order=5), 1, '조리 기구 전원 차단'),
  ((SELECT id FROM ri WHERE display_order=5), 2, 'E1·E2·E3 통해 외부 이동'),
  ((SELECT id FROM ri WHERE display_order=5), 3, '부두 외부 광장 집결');

-- market
WITH rd AS (
  INSERT INTO route_data (role, title, description) VALUES
    ('market', '마켓 구역 동선', '부스 셋업, 관람객 탐색 흐름, 재고 보충 동선을 숙지하세요.')
  RETURNING id
),
ri AS (
  INSERT INTO route_items (route_data_id, display_order, name, note) VALUES
    ((SELECT id FROM rd), 1, '스태프 출근 동선',       '09:00 오픈 전 부스 셋업 및 상품 진열 완료'),
    ((SELECT id FROM rd), 2, '실내 마켓 동선 (M1·M2)', 'FA1 의무실 중앙 기준 좌우 배치 — 문의 시 FA1로 안내'),
    ((SELECT id FROM rd), 3, '재고 보충 동선',          '통로 차단 금지 — 45분 이내 처리'),
    ((SELECT id FROM rd), 4, '비상 대피 동선',          NULL)
  RETURNING id, display_order
)
INSERT INTO route_steps (route_item_id, display_order, step) VALUES
  ((SELECT id FROM ri WHERE display_order=1), 1, '외부 주차장 도착'),
  ((SELECT id FROM ri WHERE display_order=1), 2, 'E3 옆 통로 진입'),
  ((SELECT id FROM ri WHERE display_order=1), 3, '동문시장 M1 / 서문시장 M2 배치'),
  ((SELECT id FROM ri WHERE display_order=2), 1, '실내 하단 좌측 동문시장 M1'),
  ((SELECT id FROM ri WHERE display_order=2), 2, 'FA1 의무실·주민자치센터 (중앙)'),
  ((SELECT id FROM ri WHERE display_order=2), 3, '실내 하단 우측 서문시장 M2'),
  ((SELECT id FROM ri WHERE display_order=3), 1, 'E3 옆 서비스 통로'),
  ((SELECT id FROM ri WHERE display_order=3), 2, '각 마켓 부스 후면'),
  ((SELECT id FROM ri WHERE display_order=3), 3, '신속 보충 후 통로 정리'),
  ((SELECT id FROM ri WHERE display_order=4), 1, '귀중품 보관 후 부스 이탈'),
  ((SELECT id FROM ri WHERE display_order=4), 2, 'E1·E2 통해 야외 이동'),
  ((SELECT id FROM ri WHERE display_order=4), 3, 'E3 통해 부두 외부 광장 집결');

-- popup
WITH rd AS (
  INSERT INTO route_data (role, title, description) VALUES
    ('popup', '팝업존 동선', 'BTS THE CITY 팝업 운영, 방문객 체험 흐름 동선을 숙지하세요.')
  RETURNING id
),
ri AS (
  INSERT INTO route_items (route_data_id, display_order, name, note) VALUES
    ((SELECT id FROM rd), 1, '스태프 출근 동선',  '10:00 오픈 전 장비 전원 및 체험 동선 확인 완료'),
    ((SELECT id FROM rd), 2, '방문객 체험 동선',  NULL),
    ((SELECT id FROM rd), 3, '비상 대피 동선',    '전기 이상 시 즉시 시설팀(#103) 신고 후 운영 중단')
  RETURNING id, display_order
)
INSERT INTO route_steps (route_item_id, display_order, step) VALUES
  ((SELECT id FROM ri WHERE display_order=1), 1, '외부 주차장 도착'),
  ((SELECT id FROM ri WHERE display_order=1), 2, 'E3 입구 진입'),
  ((SELECT id FROM ri WHERE display_order=1), 3, 'P1 항구마을테마파크 (야외 좌측) 배치'),
  ((SELECT id FROM ri WHERE display_order=2), 1, 'E3 입구 → 야외 좌측 진입'),
  ((SELECT id FROM ri WHERE display_order=2), 2, 'P1 항구마을테마파크'),
  ((SELECT id FROM ri WHERE display_order=2), 3, 'BTS THE CITY ARIRANG BUSAN 체험 → 출구'),
  ((SELECT id FROM ri WHERE display_order=3), 1, '장비 전원 차단'),
  ((SELECT id FROM ri WHERE display_order=3), 2, '관람객 E3 방향 유도'),
  ((SELECT id FROM ri WHERE display_order=3), 3, '부두 외부 광장 집결');

-- stage
WITH rd AS (
  INSERT INTO route_data (role, title, description) VALUES
    ('stage', '공연·체험 구역 동선', '수중광장(버블쇼), 포트게더링 안전 관리 동선을 숙지하세요.')
  RETURNING id
),
ri AS (
  INSERT INTO route_items (route_data_id, display_order, name, note) VALUES
    ((SELECT id FROM rd), 1, '스태프 출근 동선',    '07:00까지 배치 완료 — 안전 펜스·음향·조명 사전 점검'),
    ((SELECT id FROM rd), 2, '수중광장 동선 (C1)',   '수용 500명 — 400명 초과 시 입장 속도 조절'),
    ((SELECT id FROM rd), 3, '포트게더링 동선 (C3)', '수용 250명 — 200명 이상 시 입장 통제'),
    ((SELECT id FROM rd), 4, '비상 대피 동선',       '압사 위험 감지 즉시 운영본부(#101) 보고 — 공연 중단 요청')
  RETURNING id, display_order
)
INSERT INTO route_steps (route_item_id, display_order, step) VALUES
  ((SELECT id FROM ri WHERE display_order=1), 1, '외부 주차장 도착'),
  ((SELECT id FROM ri WHERE display_order=1), 2, 'E3 옆 통로 진입'),
  ((SELECT id FROM ri WHERE display_order=1), 3, '담당 구역(C1·C3) 배치'),
  ((SELECT id FROM ri WHERE display_order=2), 1, '실내 중앙 버블쇼·수중광장 C1'),
  ((SELECT id FROM ri WHERE display_order=2), 2, '관람 구역 안전선 유지'),
  ((SELECT id FROM ri WHERE display_order=2), 3, '관람 후 동문/서문 방향 퇴장 유도'),
  ((SELECT id FROM ri WHERE display_order=3), 1, 'E3 입구 → 야외 우측'),
  ((SELECT id FROM ri WHERE display_order=3), 2, '포트게더링 C3'),
  ((SELECT id FROM ri WHERE display_order=3), 3, 'E3 출구 인접 — 퇴장 관리 협조'),
  ((SELECT id FROM ri WHERE display_order=4), 1, '공연 중단 안내'),
  ((SELECT id FROM ri WHERE display_order=4), 2, 'C1 → E1·E2 통해 야외'),
  ((SELECT id FROM ri WHERE display_order=4), 3, 'C3 → E3 통해 부두 외부 광장 집결');

-- facility
WITH rd AS (
  INSERT INTO route_data (role, title, description) VALUES
    ('facility', '편의시설 동선', '시설 순찰, 의무실·안내센터, 파도비우소 운영 동선을 숙지하세요.')
  RETURNING id
),
ri AS (
  INSERT INTO route_items (route_data_id, display_order, name, note) VALUES
    ((SELECT id FROM rd), 1, '스태프 출근 동선',     '08:00까지 AED·구급함·소모품 점검 완료'),
    ((SELECT id FROM rd), 2, '시설 순찰 경로',       '1시간 주기 순찰 — 이상 발견 시 즉시 시설팀(#103) 보고'),
    ((SELECT id FROM rd), 3, '응급 의료 대응 동선',  '심정지 의심 시 119 신고 → AED 요청 → 즉시 CPR 시작'),
    ((SELECT id FROM rd), 4, '비상 대피 동선',       NULL)
  RETURNING id, display_order
)
INSERT INTO route_steps (route_item_id, display_order, step) VALUES
  ((SELECT id FROM ri WHERE display_order=1), 1, '외부 주차장 도착'),
  ((SELECT id FROM ri WHERE display_order=1), 2, 'E3 옆 통로 진입 후 E2 통과'),
  ((SELECT id FROM ri WHERE display_order=1), 3, 'FA1 의무실·주민자치센터 오픈 준비'),
  ((SELECT id FROM ri WHERE display_order=2), 1, 'FA1 실내 중앙 출발'),
  ((SELECT id FROM ri WHERE display_order=2), 2, 'FA2 파도비우소 점검 (실내 우측 독립)'),
  ((SELECT id FROM ri WHERE display_order=2), 3, 'E2 통과 후 야외 FA5 항구마을우물 확인'),
  ((SELECT id FROM ri WHERE display_order=2), 4, 'FA1 복귀'),
  ((SELECT id FROM ri WHERE display_order=3), 1, '사고 현장 응급처치 (AED·CPR)'),
  ((SELECT id FROM ri WHERE display_order=3), 2, 'FA1 의무실로 이송 또는 현장 처치'),
  ((SELECT id FROM ri WHERE display_order=3), 3, 'E3 입구 앞 구급차 대기 동선 확보'),
  ((SELECT id FROM ri WHERE display_order=4), 1, 'FA1·FA2 시설 마감'),
  ((SELECT id FROM ri WHERE display_order=4), 2, '관람객 취약자(노약자·어린이) 우선 유도'),
  ((SELECT id FROM ri WHERE display_order=4), 3, 'E2 통과 후 E3 통해 부두 외부 광장 집결');

-- =====================================================
-- Seed: Route Paths
-- 좌표 기준 (SVG 900x680)
-- 실내 상단 y=46~189 / 실내 하단 y=193~336
-- FA2 x=730~890 y=40~340 (실내 우측 독립)
-- FOOD줄 y=372~416
-- 야외 y=430~650
-- E1: x=180~260 cx=220 / E2: x=560~640 cx=600 / E3: x=825~865
-- 실내↔야외 이동은 반드시 E1 또는 E2 통과
-- =====================================================
DELETE FROM route_path_waypoints;
DELETE FROM route_path_zones;
DELETE FROM route_paths;

-- ENTRANCE
INSERT INTO route_paths (role, display_order, label, color) VALUES
  ('entrance', 1, '스태프 출근',    '#facc15'),
  ('entrance', 2, '관람객 입장',    '#60a5fa'),
  ('entrance', 3, 'E1·E2 내부이동', '#34d399'),
  ('entrance', 4, 'E3 혼잡 대응',   '#fb923c'),
  ('entrance', 5, '비상 대피',      '#f87171');

INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('E3'), ('E1'), ('E2')) AS z(zone_id)
WHERE rp.role = 'entrance' AND rp.display_order = 1;
INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('E3'), ('E1'), ('E2'), ('F1'), ('F2')) AS z(zone_id)
WHERE rp.role = 'entrance' AND rp.display_order = 2;
INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('E1'), ('E2'), ('F1'), ('F2'), ('M1'), ('M2')) AS z(zone_id)
WHERE rp.role = 'entrance' AND rp.display_order = 3;
INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('E3')) AS z(zone_id)
WHERE rp.role = 'entrance' AND rp.display_order = 4;
INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('E3'), ('E1'), ('E2')) AS z(zone_id)
WHERE rp.role = 'entrance' AND rp.display_order = 5;

INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES
  (0, 0, 825, 540), (0, 1, 825, 394), (0, 2, 260, 394),
  (1, 0, 825, 540), (1, 1, 825, 394), (1, 2, 640, 394)
) AS w(pi, di, x, y)
WHERE rp.role = 'entrance' AND rp.display_order = 1;

INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES
  (0, 0, 825, 540), (0, 1, 825, 394), (0, 2, 260, 394),
  (1, 0, 825, 540), (1, 1, 825, 394), (1, 2, 640, 394),
  (2, 0, 260, 394), (2, 1, 260, 372), (2, 2, 220, 372), (2, 3, 220, 189),
  (3, 0, 640, 394), (3, 1, 640, 372), (3, 2, 600, 372), (3, 3, 600, 189)
) AS w(pi, di, x, y)
WHERE rp.role = 'entrance' AND rp.display_order = 2;

INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES
  (0, 0, 215, 372), (0, 1, 215, 336),
  (1, 0, 225, 372), (1, 1, 225, 189),
  (2, 0, 595, 372), (2, 1, 595, 336),
  (3, 0, 605, 372), (3, 1, 605, 189)
) AS w(pi, di, x, y)
WHERE rp.role = 'entrance' AND rp.display_order = 3;

INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES
  (0, 0, 260, 394), (0, 1, 825, 394), (0, 2, 825, 540),
  (1, 0, 640, 394), (1, 1, 825, 394), (1, 2, 825, 540)
) AS w(pi, di, x, y)
WHERE rp.role = 'entrance' AND rp.display_order = 5;

-- FNB
INSERT INTO route_paths (role, display_order, label, color) VALUES
  ('fnb', 1, '스태프 출근',   '#facc15'),
  ('fnb', 2, '식재료 입고',   '#60a5fa'),
  ('fnb', 3, '실내 식당가',   '#34d399'),
  ('fnb', 4, '야외 FOOD부스', '#fb923c'),
  ('fnb', 5, '비상 대피',     '#f87171');

INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('E3'), ('F3'), ('F4'), ('F5'), ('F6'), ('F1'), ('F2'), ('F8')) AS z(zone_id)
WHERE rp.role = 'fnb' AND rp.display_order = 1;
INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('E3'), ('F3'), ('F4'), ('F5'), ('F6')) AS z(zone_id)
WHERE rp.role = 'fnb' AND rp.display_order = 2;
INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('F1'), ('F2')) AS z(zone_id)
WHERE rp.role = 'fnb' AND rp.display_order = 3;
INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('F3'), ('F4'), ('F5'), ('F6')) AS z(zone_id)
WHERE rp.role = 'fnb' AND rp.display_order = 4;
INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('F1'), ('F2'), ('F3'), ('F4'), ('F5'), ('F6'), ('F8'), ('E1'), ('E2'), ('E3')) AS z(zone_id)
WHERE rp.role = 'fnb' AND rp.display_order = 5;

INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES
  (0, 0, 825, 540), (0, 1, 825, 394), (0, 2, 100, 394),
  (1, 0, 825, 540), (1, 1, 825, 394), (1, 2, 260, 394), (1, 3, 220, 394), (1, 4, 220, 372), (1, 5, 128, 372), (1, 6, 128, 189),
  (2, 0, 825, 540), (2, 1, 825, 394), (2, 2, 640, 394), (2, 3, 600, 394), (2, 4, 600, 372), (2, 5, 592, 372), (2, 6, 592, 189),
  (3, 0, 825, 540), (3, 1, 680, 540), (3, 2, 680, 430)
) AS w(pi, di, x, y)
WHERE rp.role = 'fnb' AND rp.display_order = 1;

INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES
  (0, 0, 825, 540), (0, 1, 825, 394), (0, 2, 100, 394),
  (1, 0, 100, 394), (1, 1, 180, 394),
  (2, 0, 180, 394), (2, 1, 260, 394),
  (3, 0, 560, 394), (3, 1, 640, 394)
) AS w(pi, di, x, y)
WHERE rp.role = 'fnb' AND rp.display_order = 2;

INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES
  (0, 0, 238, 108), (0, 1, 482, 108),
  (1, 0, 482, 132), (1, 1, 238, 132)
) AS w(pi, di, x, y)
WHERE rp.role = 'fnb' AND rp.display_order = 3;

INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES
  (0, 0, 20, 394), (0, 1, 880, 394)
) AS w(pi, di, x, y)
WHERE rp.role = 'fnb' AND rp.display_order = 4;

INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES
  (0, 0, 128, 189), (0, 1, 128, 394), (0, 2, 825, 394), (0, 3, 825, 540),
  (1, 0, 592, 189), (1, 1, 592, 394), (1, 2, 825, 394), (1, 3, 825, 540),
  (2, 0, 20,  394), (2, 1, 825, 394), (2, 2, 825, 540),
  (3, 0, 680, 430), (3, 1, 680, 540), (3, 2, 825, 540)
) AS w(pi, di, x, y)
WHERE rp.role = 'fnb' AND rp.display_order = 5;

-- MARKET
INSERT INTO route_paths (role, display_order, label, color) VALUES
  ('market', 1, '스태프 출근', '#facc15'),
  ('market', 2, '실내 마켓',   '#34d399'),
  ('market', 3, '재고 보충',   '#fb923c'),
  ('market', 4, '비상 대피',   '#f87171');

INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('E3'), ('M1'), ('M2')) AS z(zone_id)
WHERE rp.role = 'market' AND rp.display_order = 1;
INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('M1'), ('M2')) AS z(zone_id)
WHERE rp.role = 'market' AND rp.display_order = 2;
INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('E3'), ('M1'), ('M2')) AS z(zone_id)
WHERE rp.role = 'market' AND rp.display_order = 3;
INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('M1'), ('M2'), ('E1'), ('E2'), ('E3')) AS z(zone_id)
WHERE rp.role = 'market' AND rp.display_order = 4;

-- market waypoints: E3→FOOD줄→E1/E2 통과→실내 M1/M2
INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES
  -- E3→E1 통과→M1
  (0, 0, 825, 416), (0, 1, 220, 416), (0, 2, 220, 372), (0, 3, 220, 336), (0, 4, 18, 336),
  -- E3→E2 통과→M2
  (1, 0, 825, 416), (1, 1, 600, 416), (1, 2, 600, 372), (1, 3, 600, 336), (1, 4, 702, 336)
) AS w(pi, di, x, y)
WHERE rp.role = 'market' AND rp.display_order = 1;

INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES
  (0, 0, 238, 258), (0, 1, 482, 258),
  (1, 0, 482, 272), (1, 1, 238, 272)
) AS w(pi, di, x, y)
WHERE rp.role = 'market' AND rp.display_order = 2;

INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES
  (0, 0, 825, 416), (0, 1, 220, 416), (0, 2, 220, 372), (0, 3, 220, 336), (0, 4, 18, 336),
  (1, 0, 825, 416), (1, 1, 600, 416), (1, 2, 600, 372), (1, 3, 600, 336), (1, 4, 702, 336)
) AS w(pi, di, x, y)
WHERE rp.role = 'market' AND rp.display_order = 3;

-- market 비상대피: M1→E1 통과→E3, M2→E2 통과→E3
INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES
  (0, 0, 18, 336), (0, 1, 220, 336), (0, 2, 220, 372), (0, 3, 220, 416), (0, 4, 825, 416), (0, 5, 825, 540),
  (1, 0, 702, 336), (1, 1, 600, 336), (1, 2, 600, 372), (1, 3, 600, 416), (1, 4, 825, 416), (1, 5, 825, 540)
) AS w(pi, di, x, y)
WHERE rp.role = 'market' AND rp.display_order = 4;

-- POPUP
INSERT INTO route_paths (role, display_order, label, color) VALUES
  ('popup', 1, '스태프 출근',  '#facc15'),
  ('popup', 2, '방문객 체험',  '#60a5fa'),
  ('popup', 3, '비상 대피',    '#f87171');

INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('E3'), ('P1')) AS z(zone_id)
WHERE rp.role = 'popup' AND rp.display_order = 1;
INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('E3'), ('P1')) AS z(zone_id)
WHERE rp.role = 'popup' AND rp.display_order = 2;
INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('P1'), ('E3')) AS z(zone_id)
WHERE rp.role = 'popup' AND rp.display_order = 3;

INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES (0, 0, 825, 540), (0, 1, 220, 540)) AS w(pi, di, x, y)
WHERE rp.role = 'popup' AND rp.display_order = 1;
INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES (0, 0, 825, 540), (0, 1, 220, 540)) AS w(pi, di, x, y)
WHERE rp.role = 'popup' AND rp.display_order = 2;
INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES (0, 0, 220, 540), (0, 1, 825, 540)) AS w(pi, di, x, y)
WHERE rp.role = 'popup' AND rp.display_order = 3;

-- STAGE
INSERT INTO route_paths (role, display_order, label, color) VALUES
  ('stage', 1, '스태프 출근',   '#facc15'),
  ('stage', 2, '수중광장 C1',   '#60a5fa'),
  ('stage', 3, '포트게더링 C3', '#fb923c'),
  ('stage', 4, '비상 대피',     '#f87171');

INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('E3'), ('C1'), ('C3')) AS z(zone_id)
WHERE rp.role = 'stage' AND rp.display_order = 1;
INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('C1'), ('E1'), ('E2')) AS z(zone_id)
WHERE rp.role = 'stage' AND rp.display_order = 2;
INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('E3'), ('C3')) AS z(zone_id)
WHERE rp.role = 'stage' AND rp.display_order = 3;
INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('C1'), ('C3'), ('E1'), ('E2'), ('E3')) AS z(zone_id)
WHERE rp.role = 'stage' AND rp.display_order = 4;

-- stage waypoints
-- 스태프 출근: E3→C3(야외), E3→E1 통과→C1 왼쪽벽(x=248, 실내 상단)
INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES
  (0, 0, 825, 540), (0, 1, 815, 540),
  (1, 0, 825, 416), (1, 1, 220, 416), (1, 2, 220, 372), (1, 3, 220, 189), (1, 4, 248, 189)
) AS w(pi, di, x, y)
WHERE rp.role = 'stage' AND rp.display_order = 1;

-- 수중광장 C1: C1 양쪽→E1/E2로 퇴장 유도
INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES
  (0, 0, 248, 118), (0, 1, 248, 372), (0, 2, 260, 372),
  (1, 0, 472, 118), (1, 1, 472, 372), (1, 2, 560, 372)
) AS w(pi, di, x, y)
WHERE rp.role = 'stage' AND rp.display_order = 2;

INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES (0, 0, 825, 540), (0, 1, 815, 540)) AS w(pi, di, x, y)
WHERE rp.role = 'stage' AND rp.display_order = 3;

-- 비상 대피: C1→E1/E2 통과→야외, C3→E3
INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES
  (0, 0, 248, 118), (0, 1, 248, 372), (0, 2, 220, 372), (0, 3, 220, 416), (0, 4, 20, 416),
  (1, 0, 472, 118), (1, 1, 472, 372), (1, 2, 600, 372), (1, 3, 600, 416), (1, 4, 825, 416), (1, 5, 825, 540),
  (2, 0, 815, 540), (2, 1, 825, 540)
) AS w(pi, di, x, y)
WHERE rp.role = 'stage' AND rp.display_order = 4;

-- FACILITY
INSERT INTO route_paths (role, display_order, label, color) VALUES
  ('facility', 1, '스태프 출근', '#facc15'),
  ('facility', 2, '시설 순찰',   '#60a5fa'),
  ('facility', 3, '응급 의료',   '#fb923c'),
  ('facility', 4, '비상 대피',   '#f87171');

INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('E3'), ('FA1')) AS z(zone_id)
WHERE rp.role = 'facility' AND rp.display_order = 1;
INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('FA1'), ('FA2'), ('FA5')) AS z(zone_id)
WHERE rp.role = 'facility' AND rp.display_order = 2;
INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('FA1'), ('E3')) AS z(zone_id)
WHERE rp.role = 'facility' AND rp.display_order = 3;
INSERT INTO route_path_zones (route_path_id, zone_id)
SELECT rp.id, z.zone_id FROM route_paths rp
CROSS JOIN (VALUES ('FA1'), ('FA2'), ('FA5'), ('E3')) AS z(zone_id)
WHERE rp.role = 'facility' AND rp.display_order = 4;

-- 스태프 출근: E3→E2 통과→실내 M2 cy→FA1
INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES
  (0, 0, 825, 416), (0, 1, 600, 416), (0, 2, 600, 372), (0, 3, 600, 336), (0, 4, 472, 336), (0, 5, 472, 265)
) AS w(pi, di, x, y)
WHERE rp.role = 'facility' AND rp.display_order = 1;

-- 시설 순찰: FA1→FA2(실내 수평), FA2→FA1 복귀, FA1→E2통과→야외→FA5
INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES
(0, 0, 472, 265), (0, 1, 472, 336), (0, 2, 600, 336), (0, 3, 600, 416), (0, 4, 890, 416), (0, 5, 890, 340),
  (1, 0, 890, 340), (1, 1, 890, 416), (1, 2, 600, 416), (1, 3, 600, 336), (1, 4, 472, 336), (1, 5, 472, 265),
  (2, 0, 472, 265), (2, 1, 472, 336), (2, 2, 600, 336), (2, 3, 600, 416), (2, 4, 425, 416), (2, 5, 425, 475)
) AS w(pi, di, x, y)
WHERE rp.role = 'facility' AND rp.display_order = 2;

-- 응급 의료: FA1→E2 통과→E3
INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES
  (0, 0, 472, 265), (0, 1, 472, 336), (0, 2, 600, 336), (0, 3, 600, 372), (0, 4, 600, 416), (0, 5, 825, 416), (0, 6, 825, 540)
) AS w(pi, di, x, y)
WHERE rp.role = 'facility' AND rp.display_order = 3;

-- 비상 대피: FA1→E2→E3, FA2→E2→E3, FA5→E3
INSERT INTO route_path_waypoints (route_path_id, path_index, display_order, x, y)
SELECT rp.id, w.pi, w.di, w.x, w.y FROM route_paths rp
CROSS JOIN (VALUES
(0, 0, 472, 265), (0, 1, 472, 336), (0, 2, 600, 336), (0, 3, 600, 416), (0, 4, 825, 416), (0, 5, 825, 540),
  (1, 0, 890, 340), (1, 1, 890, 430), (1, 2, 825, 430), (1, 3, 825, 540),
  (2, 0, 425, 475), (2, 1, 825, 475), (2, 2, 825, 540)
) AS w(pi, di, x, y)
WHERE rp.role = 'facility' AND rp.display_order = 4;

-- =====================================================
-- RLS Policies
-- =====================================================
ALTER TABLE staff                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results           ENABLE ROW LEVEL SECURITY;
ALTER TABLE zone_congestion        ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_data             ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_steps            ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_paths            ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_path_zones       ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_path_waypoints   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_staff"         ON staff               FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_quiz"          ON quiz_results        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_congestion"    ON zone_congestion     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_alerts"        ON alerts              FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notifications" ON training_notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_checklist"     ON checklist_items     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_route_data"    ON route_data          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_route_items"   ON route_items         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_route_steps"   ON route_steps         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_route_paths"   ON route_paths         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_route_zones"   ON route_path_zones    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_route_wpts"    ON route_path_waypoints FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_congestion_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level := CASE
    WHEN NEW.current_count::float / NEW.capacity >= 0.9 THEN 'critical'
    WHEN NEW.current_count::float / NEW.capacity >= 0.7 THEN 'high'
    WHEN NEW.current_count::float / NEW.capacity >= 0.4 THEN 'medium'
    ELSE 'low'
  END;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER congestion_level_trigger
  BEFORE INSERT OR UPDATE ON zone_congestion
  FOR EACH ROW EXECUTE FUNCTION update_congestion_level();