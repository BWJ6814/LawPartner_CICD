-- fourjo 스키마에서 테이블 목록·건수 확인 (마이그레이션 범위 체크)
-- SQL Developer에서 실행

SELECT table_name, num_rows
FROM user_tables
WHERE nested = 'NO'
ORDER BY table_name;

-- 컬럼이 USER_NO인 테이블 등 관계 파악용 (선택)
-- SELECT table_name FROM user_tab_columns WHERE column_name = 'USER_NO' ORDER BY 1;
