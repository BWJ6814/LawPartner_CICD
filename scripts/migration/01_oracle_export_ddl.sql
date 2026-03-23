-- fourjo(또는 해당 스키마)로 SQL*Plus / SQL Developer에서 실행
-- 목적: 현재 DB에 존재하는 테이블·인덱스·트리거 DDL을 파일로 저장
--
-- SQL*Plus 사용 시: @01_oracle_export_ddl.sql (스풀 경로는 본인 PC 경로로 수정)
-- SQL Developer: 스크립트 실행 후 결과를 큰 그리드로 받거나, 아래 SELECT 결과를 스크립트로 저장

SET LONG 2000000
SET LONGCHUNKSIZE 2000000
SET PAGESIZE 0
SET LINESIZE 32767
SET FEEDBACK OFF
SET VERIFY OFF
SET TRIMSPOOL ON
SET HEADING OFF
SET ECHO OFF

-- SQL*Plus일 때만 스풀 (경로는 Windows 예시 — 본인 환경에 맞게 수정)
-- SPOOL D:\migration\fourjo_schema_oracle.sql

-- ========== 1) 테이블 DDL ==========
SELECT '-- === TABLE: ' || table_name || ' ===' FROM user_tables ORDER BY table_name;
SELECT DBMS_METADATA.GET_DDL('TABLE', table_name, USER) || CHR(10) || '/' || CHR(10)
FROM user_tables
ORDER BY table_name;

-- ========== 2) 인덱스 (TABLE에 포함 안 된 보조 인덱스) ==========
-- USER_INDEXES에서 테이블과 중복되지 않게: 일부는 이미 TABLE DDL에 포함됨. 중복 실행 시 무시하거나 스크립트 정리.
SELECT DBMS_METADATA.GET_DDL('INDEX', index_name, USER) || CHR(10) || '/' || CHR(10)
FROM user_indexes
WHERE index_type != 'LOB'
  AND table_owner = USER
  AND generated = 'N'
ORDER BY index_name;

-- ========== 3) 트리거 ==========
SELECT DBMS_METADATA.GET_DDL('TRIGGER', trigger_name, USER) || CHR(10) || '/' || CHR(10)
FROM user_triggers
ORDER BY trigger_name;

-- SPOOL OFF

-- 참고: 시퀀스는 MySQL에서 AUTO_INCREMENT로 치환하므로 별도 이관 정책 필요
-- SELECT sequence_name FROM user_sequences;


delete from tb_access_log;
select * from tb_access_log;