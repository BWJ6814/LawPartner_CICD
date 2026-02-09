-- 1. 게시판 테이블 생성
CREATE TABLE TB_BOARD (
                          BOARD_NO NUMBER PRIMARY KEY,          -- 게시글 번호 (PK)
                          CATEGORY_CODE VARCHAR2(200) NOT NULL, -- 카테고리 (다중 선택 대응을 위해 사이즈 늘림)
                          TITLE VARCHAR2(300) NOT NULL,         -- 제목
                          CONTENT CLOB NOT NULL,                -- 내용 (긴 글)
                          WRITER_NO NUMBER NOT NULL,            -- 작성자 번호 (FK)
                          SECRET_YN CHAR(1) DEFAULT 'N',        -- 비밀글 여부
                          BLIND_YN CHAR(1) DEFAULT 'N',         -- 블라인드 여부
                          HIT_CNT NUMBER DEFAULT 0,             -- 조회수
                          REG_DT DATE DEFAULT SYSDATE           -- 작성일
);

select * from TB_BOARD;