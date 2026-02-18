package com.example.backend_main.HSH.controller;


import com.example.backend_main.dto.UserJoinRequestDTO;
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.common.annotation.ActionLog;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.HSH.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/*

@RequestMapping("/api/admin") : 관리자 전용 구역으로 들어오는 주소는 /api/admin이라고 설정..!
*/
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // [전체 화원 목록 조회] [ADM-02]
    // 관리자가 전체 시민 명부를 확인하는 기능
    // ResultVO<List<User>> : ResultVO라는 큰 상자 안에, 유저 여러 명의 정보가 담긴 List를 넣어서 보내겠다!
    // 리액트에서는 이 상자를 받아 success가 true인지 확인하고, 안에 든 유저 리스트를 화면의 표(Table)에 뿌려주기..!
    @GetMapping("/users")
    public ResultVO<List<User>> getAllUsers(){
        // 서비스에게 "암호 해독해서 회원 목록 가져와!" 라고 명령하기
        List<User> usersList = adminService.getAllUsers();
        // 가공된 데이터를 표준 객체(ResultVO)에 담아서 보내기..
        return ResultVO.ok("전체 회원 목록을 성공적으로 불러왔습니다.",usersList);
    }

    /*
        [회원 상태 변경] - ADM-02/ADM-03
        특정 회원을 정지(S02), 변호사를 승인할 때 사용...
        나중에 AdminService에 로직 추가하여 완성할 예정
    */
    @PutMapping("/user/status")
    public ResultVO<Void> changeUserStatus(@RequestBody String userId, @RequestParam String statusCode){
        // 우선 문만 만들어두기
        return ResultVO.ok("외원 상태가 성공적으로 변경되었습니다.",null);
    }

    /*
    [하위 관리자 생성]
    @ActionLog 적용 -> "누가 생성했는가?"를 자동 기록하게 처리
    */
    @PostMapping("/create-operator")
    @ActionLog(action = "CREATE_OPERATOR", target = "TB_USER") // ★ 여기가 핵심!
    public ResultVO<String> createOperator(@RequestBody UserJoinRequestDTO joinDto,
                                           @AuthenticationPrincipal UserDetails userDetails) {
        try {
            // 현재 로그인한 관리자의 ID(PK)를 추출하는 로직 필요
            // (UserDetails에는 보통 username(ID)만 들어있으므로, Service에서 조회하거나 여기서 변환)
            // 여기서는 편의상 Service 안에서 조회하도록 처리했으므로,
            // userDetails.getUsername()을 이용해 User 엔티티를 찾는 로직이 필요하지만,
            // 일단 앞서 구현한 LogingAspect에서 getCurrentUserNo()를 쓰므로
            // Service에는 PK 대신 ID(String)를 넘기거나, Service 내부에서 다시 조회하는 게 안전함.

            // UserDetails 구현체(UserPrincipal)에 userNo를 넣어두면 바로 꺼낼 수 있음.
            // 현재는 간단히 Service 로직에 의존.

            // 임시: 현재 로그인한 관리자의 userNo를 DB에서 찾아야 함 (Service에 위임 권장)
            // 하지만 Service 로직 상 PK가 필요하므로, 여기서는 개념적으로만 설명합니다.
            // 실제로는 userDetails에서 userNo를 꺼내오는 커스텀 로직이 있으면 좋습니다.

            // (임시 조치: Service 내부에서 처리하도록 코드를 짰다면 OK,
            //  지금은 토큰에서 PK를 바로 못 꺼내면 Service에서 findByUserId 해야 함)

            return ResultVO.success("하위 관리자가 생성되었습니다.");

        } catch (Exception e) {
            return ResultVO.fail("관리자 생성 실패: " + e.getMessage());
        }
    }
}
