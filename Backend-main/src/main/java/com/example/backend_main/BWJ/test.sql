-- 1. 게시판 테이블 생성
select * from TB_BOARD;

select * from TB_USER;

INSERT INTO TB_USER (USER_NO, USER_ID, USER_PW, USER_NM, NICK_NM, EMAIL, PHONE, ADDR, ROLE_CODE)
VALUES (1, 'user01', '1234', '홍길동', '억울한시민', 'hong@test.com', '010-1111-2222', '서울시 강남구', 'ROLE_USER');

-- 2. 일반 회원 (김철수)
INSERT INTO TB_USER (USER_NO, USER_ID, USER_PW, USER_NM, NICK_NM, EMAIL, PHONE, ADDR, ROLE_CODE)
VALUES (2, 'user02', '1234', '김철수', '법률꿈나무', 'kim@test.com', '010-3333-4444', '경기도 수원시', 'ROLE_USER');

-- 3. 변호사 (박변호) - 답변 달아줄 사람
INSERT INTO TB_USER (USER_NO, USER_ID, USER_PW, USER_NM, NICK_NM, EMAIL, PHONE, ADDR, ROLE_CODE)
VALUES (3, 'lawyer01', '1234', '박변호', '박변호사', 'park@law.com', '010-5555-6666', '서울시 서초구 법원로', 'ROLE_LAWYER');

-- 4. 변호사 (최변호)
INSERT INTO TB_USER (USER_NO, USER_ID, USER_PW, USER_NM, NICK_NM, EMAIL, PHONE, ADDR, ROLE_CODE)
VALUES (4, 'lawyer02', '1234', '최변호', '최강변호사', 'choi@law.com', '010-7777-8888', '부산시 연제구', 'ROLE_LAWYER');

-- 5. 관리자 (Admin)
INSERT INTO TB_USER (USER_NO, USER_ID, USER_PW, USER_NM, NICK_NM, EMAIL, PHONE, ADDR, ROLE_CODE)
VALUES (5, 'admin', 'admin1234', '관리자', 'Admin', 'admin@lawai.com', '010-9999-0000', '서울시', 'ROLE_ADMIN');

-- 저장
COMMIT;

ALTER TABLE TB_BOARD MODIFY (CATEGORY_CODE VARCHAR2(200));
commit;


-- 1. [복수 선택] 부동산 전세 사기 + 형사 고소 (부동산,형사범죄)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT)
VALUES ('부동산,형사범죄', '전세 사기 고소 가능한가요?', '집주인이 잠적했습니다. 보증금 반환 소송과 동시에 형사 고소도 진행하고 싶습니다. 절차 알려주세요.', 1, 150);

-- 2. [단일 선택] 교통사고 과실 비율
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT)
VALUES ('교통사고', '교차로 사고 과실 비율 문의', '신호 없는 교차로에서 우측 차량과 충돌했습니다. 제 과실이 얼마나 잡힐까요?', 1, 42);

-- 3. [복수 선택] 이혼 + 재산분할 + 양육비 (이혼,가사,재산분할)
-- (실제 카테고리 명칭에 맞춰서 넣으세요. 예: 이혼,상속/가사)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, SECRET_YN)
VALUES ('이혼,상속/가사', '이혼 소송 중 재산분할 질문입니다. (비밀글)', '결혼 10년차입니다. 남편 명의 아파트가 있는데 재산 형성 기여도를 인정받을 수 있을까요?', 1, 'Y');

-- 4. [단일 선택] 부당해고 (노동)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, REG_DT)
VALUES ('노동', '수습기간 해고 통보', '입사 2개월 차인데 내일부터 나오지 말라고 합니다. 구제 신청 가능한가요?', 1, SYSDATE - 3);

-- 5. [복수 선택] 채권추심 + 손해배상 (채권추심,손해배상)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT)
VALUES ('채권추심,손해배상', '빌려준 돈을 못 받고 있습니다.', '친구에게 2천만원을 빌려줬는데 1년째 갚지 않습니다. 민사 소송 비용과 기간이 궁금합니다.', 1, 88);

-- 변경사항 저장
COMMIT;



-- 1. 교통사고 + 손해배상 (작성자 2)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT, REG_DT)
VALUES ('교통사고,손해배상', '주차장 뺑소니(물피도주) 잡았습니다.', 'CCTV 확인해서 잡았는데 사과도 없이 보험처리만 해준다고 하네요. 괘씸해서 렌트까지 싹 다 하고 싶은데 가능한가요?', 2, 55, SYSDATE - 20);

-- 2. 부동산 + 임대차 (작성자 1)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT, REG_DT)
VALUES ('부동산,임대차', '묵시적 갱신 후 이사 통보 복비 문제', '묵시적 갱신 상태에서 제가 이사를 가려고 합니다. 집주인은 제가 복비를 내야 한다고 하는데 법적으로 누가 내는 게 맞나요?', 1, 120, SYSDATE - 18);

-- 3. 이혼 + 가사 (작성자 3)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT, REG_DT)
VALUES ('이혼,상속/가사', '배우자의 외도로 인한 위자료 청구 소송', '증거(카톡, 블랙박스)는 확보했습니다. 상간녀 소송도 같이 진행하고 싶은데 변호사 선임 비용이 궁금합니다.', 3, 200, SYSDATE - 15);

-- 4. 노동 (작성자 4)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT, REG_DT)
VALUES ('노동', '주휴수당 미지급 신고하려고 합니다.', '편의점 알바 6개월 했는데 주휴수당을 한 번도 못 받았습니다. 근로계약서는 안 썼는데 신고 가능한가요?', 4, 30, SYSDATE - 14);

-- 5. 대여금 + 채권추심 (작성자 2)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT, REG_DT)
VALUES ('대여금,채권추심', '차용증 없이 빌려준 돈 500만원', '친구라 믿고 그냥 이체해줬는데 1년째 갚지 않습니다. 카톡 대화 내용이랑 이체 내역만 있는데 소송 승산 있을까요?', 2, 80, SYSDATE - 12);

-- 6. 형사범죄 (작성자 1, 비밀글)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, SECRET_YN, REG_DT)
VALUES ('형사범죄', '보이스피싱 인출책 혐의 조사를 받으러 오랍니다. (비밀글)', '고액 알바인 줄 알고 심부름만 했는데 경찰서에서 연락이 왔습니다. 저 감옥 가나요? 너무 무섭습니다.', 1, 'Y', SYSDATE - 10);

-- 7. 상속 (작성자 3)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT, REG_DT)
VALUES ('상속/가사', '아버지가 빚만 남기고 돌아가셨습니다.', '상속포기랑 한정승인 중에 어떤 걸 해야 할지 모르겠습니다. 절차랑 비용 문의드립니다.', 3, 45, SYSDATE - 9);

-- 8. 지식재산권 + 기업 (작성자 4)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT, REG_DT)
VALUES ('지식재산권,기업', '쇼핑몰 상세페이지 저작권 침해 경고장', '제가 쓴 폰트가 유료 폰트라고 법무법인에서 내용증명이 왔습니다. 패키지 구매하라고 하는데 무시해도 되나요?', 4, 10, SYSDATE - 8);

-- 9. 계약서 검토 (작성자 2)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT, REG_DT)
VALUES ('계약서 검토', '동업 계약서 작성 시 주의사항 알려주세요.', '친구랑 카페 창업하려는데 나중에 문제 안 생기게 계약서 꼼꼼하게 쓰고 싶습니다. 필수 조항 추천 부탁드려요.', 2, 60, SYSDATE - 7);

-- 10. 회생/파산 (작성자 1)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT, REG_DT)
VALUES ('회생/파산', '20대 개인회생 신청 자격 문의', '주식과 코인으로 빚이 5천만원입니다. 월급은 200인데 회생 가능할까요? 기각될까 봐 걱정입니다.', 1, 90, SYSDATE - 6);

-- 11. 교통사고 (작성자 3)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT, REG_DT)
VALUES ('교통사고', '교차로 우회전 일시정지 위반 단속', '사람이 없어서 서행하며 지나갔는데 경찰이 잡았습니다. 이거 범칙금 내야 하나요? 억울합니다.', 3, 25, SYSDATE - 5);

-- 12. 부동산 + 손해배상 (작성자 4)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT, REG_DT)
VALUES ('부동산,손해배상', '윗집 누수로 천장이 다 젖었습니다.', '윗집 집주인이 수리를 차일피일 미루고 연락도 안 받습니다. 내용증명 보내고 소송 가야 하나요?', 4, 110, SYSDATE - 4);

-- 13. 형사범죄 + 명예훼손 (작성자 2, 비밀글)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, SECRET_YN, REG_DT)
VALUES ('형사범죄,기타', '인터넷 댓글 모욕죄 고소당했습니다. (비밀글)', '게임하다가 욱해서 패드립을 쳤는데 고소장이 날아왔습니다. 합의금 얼마 정도 부르면 될까요? 전과 남나요?', 2, 'Y', SYSDATE - 4);

-- 14. 형사범죄 + 사기 (작성자 1)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT, REG_DT)
VALUES ('형사범죄,손해배상', '중고나라 사기 당했습니다. 배상명령신청?', '소액이라 경찰이 신경 안 써주는 것 같아요. 범인은 잡혔다는데 돈 돌려받으려면 어떻게 해야 하나요?', 1, 70, SYSDATE - 3);

-- 15. 노동 + 기업 (작성자 3)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT, REG_DT)
VALUES ('노동,기업', '퇴직금 중간정산 사유 문의', '전세 자금 마련 때문에 퇴직금을 미리 받고 싶은데 무주택자면 무조건 가능한가요? 회사가 거부하면 어떡하죠?', 3, 50, SYSDATE - 2);

-- 16. 이혼 (작성자 2)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT, REG_DT)
VALUES ('이혼', '양육비 미지급자 배드파더스 공개', '전남편이 양육비를 3년째 안 줍니다. 신상 공개 사이트에 올리면 명예훼손으로 고소당하나요?', 2, 140, SYSDATE - 2);

-- 17. 상속 + 부동산 (작성자 4)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT, REG_DT)
VALUES ('상속/가사,부동산', '유류분 반환 청구 소송 기간', '큰형님이 아버지를 꼬드겨서 재산을 다 가져갔습니다. 유류분 소송하면 얼마나 돌려받을 수 있나요?', 4, 30, SYSDATE - 1);

-- 18. 기타 (작성자 1)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT, REG_DT)
VALUES ('기타', '층간소음 법적 대응 방법', '매일 밤 피아노 치는 윗집 때문에 미치겠습니다. 경찰 신고해도 소용없는데 민사 소송 되나요?', 1, 20, SYSDATE - 1);

-- 19. 손해배상 (작성자 3)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT, REG_DT)
VALUES ('손해배상', '미용실에서 머리를 다 태웠습니다.', '복구 불가능할 정도로 손상됐는데 환불이랑 위자료 받을 수 있을까요? 사진 다 찍어놨습니다.', 3, 15, SYSDATE);

-- 20. 기업 + 노동 (작성자 4)
INSERT INTO TB_BOARD (CATEGORY_CODE, TITLE, CONTENT, WRITER_NO, HIT_CNT, REG_DT)
VALUES ('기업,노동', '스타트업 스톡옵션 행사 문의', '퇴사 후 스톡옵션 행사 기간이 지났다고 회사가 주장합니다. 계약서 조항 해석 좀 부탁드립니다.', 4, 5, SYSDATE);

-- 최종 저장
COMMIT;

select * from TB_BOARD;

delete from tb_board where BOARD_NO in (26,27);

select * from TB_USER;
select * from TB_LAWYER_INFO;
select * from tb_access_log;
delete from TB_ACCESS_LOG;
select * from TB_ACCESS_LOG;

commit;

delete from tb_user;

SELECT a.table_name, a.constraint_name
FROM all_constraints a
         JOIN all_constraints b ON a.r_constraint_name = b.constraint_name
WHERE b.table_name = 'TB_USER'
  AND a.constraint_type = 'R';

select * from TB_BOARD_REPLY;
select * from TB_LAWYER_INFO;
select * from TB_AI_CHAT_LOG;
select * from TB_BOARD;
select * from tb_user;
-- ALTER TABLE TB_USER MODIFY (USER_NO RESTART START WITH 1);
commit ;

-- TB_BOARD 테이블에 닉네임 공개 여부 컬럼 추가 (0: 비공개/익명, 1: 공개)

ALTER TABLE TB_BOARD ADD IS_NICKNAME_VISIBLE NUMBER(1) DEFAULT 0;

ALTER TABLE TB_BOARD ADD NICKNAME_VISIBLE_YN CHAR(1) DEFAULT 'N';

ALTER TABLE TB_BOARD DROP COLUMN IS_NICKNAME_VISIBLE;
ALTER TABLE TB_BOARD ADD REPLY_CNT NUMBER DEFAULT 0;
ALTER TABLE TB_BOARD ADD MATCH_YN CHAR(1) DEFAULT 'N';
ALTER TABLE TB_REVIEW ADD REPLY_NO NUMBER;
COMMIT;