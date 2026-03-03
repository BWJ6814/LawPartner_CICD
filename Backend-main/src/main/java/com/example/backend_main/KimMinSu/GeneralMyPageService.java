package com.example.backend_main.KimMinSu;

import com.example.backend_main.BWJ.BoardReplyRepository;
import com.example.backend_main.BWJ.BoardRepository;
import com.example.backend_main.common.entity.CalendarEvent;
import com.example.backend_main.common.entity.ChatRoom;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.repository.ChatRoomRepository;
import com.example.backend_main.common.repository.UserRepository;
import com.example.backend_main.common.util.Aes256Util;
import com.example.backend_main.common.util.HashUtil;
import com.example.backend_main.dto.Board;
import com.example.backend_main.dto.GeneralMyPageDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.temporal.TemporalAdjusters;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // ★ DB 관리자들을 데려오기 위해 필수!
public class GeneralMyPageService {

    private final UserRepository userRepository;
    private final BoardRepository boardRepository;
    private final ChatRoomRepository chatRoomRepository;

    // ★ 방금 만든 캘린더 관리자 추가!
    private final CalendarEventRepository calendarEventRepository;
    private final BoardReplyRepository boardReplyRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    private final Aes256Util aes256Util;
    private final HashUtil hashUtil;



    public GeneralMyPageDTO getDashboardData(Long userNo) {
        GeneralMyPageDTO dto = new GeneralMyPageDTO();

        // 1. [DB 연동] 유저 이름 가져오기
        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new RuntimeException("해당 유저를 찾을 수 없습니다."));
        dto.setUserName(user.getUserNm());
        dto.setNickName(user.getNickNm() != null ? user.getNickNm() : user.getUserNm());

        // 2. 통계 카드 (아직 관련 테이블이 미완성이면 일단 0으로 세팅)
        dto.setRecentReplyCount(0);
        dto.setRequestCount(0);
        dto.setDaysLeft(null);

        // 3. [DB 연동] 내 상담 요청 내역 진짜로 가져오기
        List<ChatRoom> myChatRooms = chatRoomRepository.findByUserNoOrderByRegDtDesc(userNo); // 리포지토리에 이 메서드 만들어야 됨

        List<GeneralMyPageDTO.ConsultationItemDTO> consultList = myChatRooms.stream().map(room -> {
            GeneralMyPageDTO.ConsultationItemDTO item = new GeneralMyPageDTO.ConsultationItemDTO();

            String lawyerName = "매칭 대기중";

            if (room.getLawyerNo() != null) {
                // userRepository를 통해 변호사의 User 정보를 팩트 체크함
                lawyerName = userRepository.findById(room.getLawyerNo())
                        .map(u -> u.getUserNm() + " 변호사") // 이름 뒤에 '변호사' 칭호 붙여주는 게 국룰
                        .orElse("퇴사한 변호사"); // 혹시 유저 정보가 없으면 예외 처리
            }

            item.setLawyerName(lawyerName);
            item.setCategory("일반상담");

            // ST01=대기, ST02=상담중, ST03=완료
            if ("ST01".equals(room.getProgressCode())) item.setStatus("대기");
            else if ("ST02".equals(room.getProgressCode())) item.setStatus("상담중");
            else item.setStatus("완료");

            // 날짜는 String으로 임시 처리
            item.setRegDate(room.getRegDt() != null ? room.getRegDt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) : "날짜 미상");
            return item;
        }).collect(Collectors.toList());

        dto.setRecentConsultations(consultList);

        // 4. [DB 연동] 최근 내 게시판 목록 가져오기 (방금 1단계에서 만든 명령어 사용)
        List<Board> myBoards = boardRepository.findTop5ByWriterNoOrderByRegDtDesc(userNo);

        List<GeneralMyPageDTO.MyBoardDTO> postList = myBoards.stream().map(board -> {
            GeneralMyPageDTO.MyBoardDTO postDTO = new GeneralMyPageDTO.MyBoardDTO();
            postDTO.setBoardNo(board.getBoardNo());
            postDTO.setTitle(board.getTitle());
            // 날짜 형식 예쁘게 변환
            if(board.getRegDt() != null) {
                postDTO.setRegDate(board.getRegDt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
            }

            int replyCount = boardReplyRepository.countByBoardNo(board.getBoardNo());
            postDTO.setReplyCount(replyCount);

            return postDTO;
        }).collect(Collectors.toList());

        dto.setRecentPosts(postList);

        // 5. 캘린더 일정 (추후 연동, 일단 빈 배열)

        LocalDateTime today = LocalDateTime.now();

        String startOfMonth = today.withDayOfMonth(1).format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

        String endOfMonth = today.with(TemporalAdjusters.lastDayOfMonth())
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));


        System.out.println("조회 기간 :" + startOfMonth + " ~ " + endOfMonth);

        List<CalendarEvent> myEvents = calendarEventRepository.findByUserNoAndStartDateBetween(userNo, startOfMonth, endOfMonth);

        List<GeneralMyPageDTO.CalendarEventDTO> eventList = myEvents.stream().map(event -> {
            GeneralMyPageDTO.CalendarEventDTO calDTO = new GeneralMyPageDTO.CalendarEventDTO();

            // 1. 방금 DTO에 추가한 ID 꽂아주기 (필수)
            calDTO.setId(event.getEventNo()); // ★ ID 꽂아주기
            calDTO.setTitle(event.getTitle()); // ★ "[개인]" 떼고 깔끔하게 제목만
            calDTO.setStart(event.getStartDate());
            calDTO.setBackgroundColor(event.getColorCode());
            return calDTO;
        }).collect(Collectors.toList());

        dto.setCalendarEvents(eventList);

        return dto;


    }


    @org.springframework.transaction.annotation.Transactional
    public Long saveCalendarEvent(Long userNo, GeneralMyPageDTO.CalendarEventDTO dto) {

        // 프론트에서 넘어온 데이터와 임시 기본값을 조합해 Entity를 조립합니다.
        CalendarEvent event = CalendarEvent.builder()
                .userNo(userNo)
                .title(dto.getTitle())
                .startDate(dto.getStart())
                .colorCode(dto.getBackgroundColor())
                .roomId(null)
                .lawyerNo(null)
                .build();

        // 조립된 Entity를 DB에 저장합니다.
        CalendarEvent savedEvent = calendarEventRepository.save(event);

        // 저장 직후 DB에서 자동 생성된 eventNo를 꺼내서 컨트롤러로 돌려줍니다.
        return savedEvent.getEventNo();
    }

    @org.springframework.transaction.annotation.Transactional
    public void updateCalendarEvent(Long eventNo, Long userNo, GeneralMyPageDTO.CalendarEventDTO dto) {
        CalendarEvent event = calendarEventRepository.findById(eventNo)
                .orElseThrow(() -> new RuntimeException("일정을 찾을 수 없습니다."));

        // ★ 내 일정이 맞는지 팩트 체크
        if (!event.getUserNo().equals(userNo)) {
            throw new RuntimeException("수정 권한이 없습니다.");
        }
        event.setTitle(dto.getTitle());
        event.setColorCode(dto.getBackgroundColor());
        event.setStartDate(dto.getStart());
        // JPA의 더티 체킹(Dirty Checking) 덕분에 별도로 save()를 안 해도 DB에 반영됨
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteCalendarEvent(Long eventNo, Long userNo) {

        CalendarEvent event = calendarEventRepository.findById(eventNo)
                .orElseThrow(() -> new RuntimeException("일정을 찾을 수 없습니다."));

        if (!event.getUserNo().equals(userNo)) {
            throw new RuntimeException("삭제 권한이 없습니다.");
        }

        calendarEventRepository.deleteById(eventNo);
    }

    @org.springframework.transaction.annotation.Transactional
    public void updateProfile(Long userNo, String newName) {
        User user = userRepository.findById(userNo).orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));
        user.setNickNm(newName); // JPA 더티체킹으로 자동 UPDATE 됨
    }

    @org.springframework.transaction.annotation.Transactional
    public void updateProfileData(Long userNo, String name, String email, String phone, MultipartFile profileImage) throws Exception {
        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));

        if (name != null && !name.isBlank()) {
            user.setUserNm(name);
        }
        if (email != null && !email.isBlank()) {
            user.setEmail(aes256Util.encrypt(email));
            user.setEmailHash(hashUtil.generateHash(email));
        }
        if (phone != null && !phone.isBlank()) {
            user.setPhone(aes256Util.encrypt(phone));
            user.setPhoneHash(hashUtil.generateHash(phone));
        }
        // profileImage: 일반 유저는 프로필 이미지 서버 저장 미지원 (변호사는 /api/ky/profile/image 사용)
    }

    @org.springframework.transaction.annotation.Transactional
    public void updatePassword(Long userNo, String oldPw, String newPw) {
        User user = userRepository.findById(userNo).orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));
        // 팩트 체크: 예전 비밀번호가 맞는지 검증
        if (!passwordEncoder.matches(oldPw, user.getUserPw())) {
            throw new RuntimeException("기존 비밀번호가 일치하지 않습니다.");
        }
        // 새 비밀번호 암호화해서 저장
        user.setUserPw(passwordEncoder.encode(newPw));
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteAccount(Long userNo) {
        // 실제 실무에서는 deleteById 대신 status를 '탈퇴'로 바꾸지만, 일단 진짜 삭제로 간다
        // userRepository.deleteById(userNo);

        User user = userRepository.findById(userNo)
                .orElseThrow(() -> new RuntimeException("유저를 찾을 수 없습니다."));

        user.setStatusCode("S99"); // JPA 더티 체킹으로 알아서 자동 UPDATE 됨

        String dummyEmail = "deleted_" +userNo+ UUID.randomUUID().toString().substring(0, 6)+"@law.com";
        String dummyPhone = "010-0000-" +userNo + UUID.randomUUID().toString().substring(0, 6) ;
        String dummyUserId = "deleted_" +userNo + UUID.randomUUID().toString().substring(0, 16);

        user.setNickNm("탈퇴한 사용자");
        user.setUserId(dummyUserId);
        user.setEmail(user.getEmailHash());
        user.setPhone(user.getPhoneHash());
        user.setEmailHash(dummyEmail);
        user.setPhoneHash(dummyPhone);
    }
}