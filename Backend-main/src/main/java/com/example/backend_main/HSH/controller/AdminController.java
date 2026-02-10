package com.example.backend_main.HSH.controller;

import com.example.backend_main.common.entity.User;
import com.example.backend_main.common.vo.ResultVO;
import com.example.backend_main.HSH.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // [전체 화원 목록 조회] [ADM-02]
    // 관리자가 전체 시민 명부를 확인하는 기능
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
}
