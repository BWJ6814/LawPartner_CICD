package com.example.backendmain.common.util;

// 기계 켜지자마자 실행하는 기능
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

// @Component : 스프링이 이 클래스를 관리하도록 빈으로 등록!
// 나중에 다른 서비스에서 @Autowired로 편하게 불러다 사용 가능
@Component
public class AES256Util {
    // ALGORITHM : 암호화 방식의 레시피 설정
    // AES : 알고리즘 이름
    // CBC : Cipher Block Chaining - 이전 암호화 결과가 다음 블록에 영향을 주는 모드
    // PKCS5Padding : 암호화는 고정된 크기(블록) 단위로 진행되는데, 데이터가 그 크기에 딱 맞지 않을 때 빈공간을 채워주는 방식
    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    // AES의 블록 크기는 16바이트 고정
    private static final int IV_SIZE = 16;

    // 보안을 위해 외부 설정 파일에 적힌 키 값을 이 변수에 자동으로 넣어주기..
    @Value("${encryption.aes256.key}")
    private String secretKey;

    // 기계가 준비되자마자 실행되는 열쇠 검사원..!!
    @PostConstruct
    public void validateKey() {
        if (secretKey == null || secretKey.length() != 32) {
            throw new IllegalArgumentException("보안 경고: AES-256 열쇠는 반드시 32자여야 합니다! 현재 길이: "
                    + (secretKey == null ? 0 : secretKey.length()));
        }
    }

    // 데이터 암호화
    // 사용자의 소중한 개인 정보(이메일, 전화번호 등)를 해커가 읽을 수 없게
    // 마법의 금고에 넣어 잠그는 과정!
    public String encrypt(String plainText) throws Exception {
        // 0. 매번 새로운 랜덤 IV 생성 (BCrypt의 Salt와 같은 역할)
        // 똑같은 글자를 암호화해도 매번 결과가 다르게 나오게 하려면 랜덤한 값이 필요
        // BCrypt의 Salt와 똑같은 역할을 하는 IV(초기화 벡터)를 16칸(byte)로 만들기
        byte[] iv = new byte[IV_SIZE];
        // 아주 강력한 주사위를 굴려 16칸을 예측 불가능한 랜덤 숫자로 채우기
        new SecureRandom().nextBytes(iv);
        // 랜덤 숫자를 금고를 흔들 규칙으로 등록!
        IvParameterSpec ivSpec = new IvParameterSpec(iv);

        // 자바에게 AES 알고리즘과 블록들을 사슬처럼 엮는 CBC와 빈 공간은 PKCS5Padding 채운다고 선언!
        // ALGORITHM : 암호화 알고리즘과 동작 모드를 문자열로 지정
        // 즉, 어떤 암호화 방식으로. 어떤 모드로, 어떤 패딩을 쓸지 자바에게 알려주는 규칙 문자열
        // 1. 기계(Cipher) 준비하기 - 암호화/복호화 전용 기계
        // 브랜드의 기계인데, 블록을 사슬처럼 엮고(CBC), 빈 공간은 채워넣는(PKCS5Padding) 최신 모델!
        Cipher cipher = Cipher.getInstance(ALGORITHM);

        // SecretKeySpec : 우리가 가진 문자열 키를 AES 알고리즘이 이해할 수 있는 진짜 키 객체로 변환
        // 2. 진짜 열쇠 만들기 (properties 파일에 저장해둔 문자열 활용)
        // UTF_8 : 공통 번역기 - 문자를 바이트 숫자로 인코딩하는 방식 - 전 세계 표전 번역기를 돌려 숫자로 변경 후
        // AES : 금고 브랜드 - 암호화 알고리즘 규격 - AES 금고에 딱 맞는 실물 열쇠 객체로 변환..!
        SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "AES");

        // 첫 블록을 암호화할 때 필요한 초기화 벡터(IV). 키의 앞 16글자만 사용 (0, 16)
        // 3. 안에 든 내용을 한 번 무작위로 섞어서 이중 보안 처리..
        // 기계에 열쇠를 꽃고 흔들기 규칙을 설정 -> 마지막에 잠금 모드로 작동해!라고 스위치 온!
        IvParameterSpec ivSpec = new IvParameterSpec(secretKey.substring(0, 16).getBytes(StandardCharsets.UTF_8));

        // 이 엔진을 암호화/복호화 구분하기
        // 4. 기계 잠금모드 설정하기
        // keySpec : 열쇠
        // ivSpec : 섞는 규칙
        // ENCRYPT_MODE : 잠금 모드
        cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec);

        // 실제로 암호화를 수행하여 바이너리(byte 배열) 데이터를 만들기
        // 5. 실제로 잠금 모드 실행하기
        // plainText : 사용자가 입력한 진짜 정보
        // 정보를 컴퓨터 숫자로 바꾼 뒤 기계에 넣고 최종 결과물을 뽑아내기 - 데이터 덩어리로 변해서 나옴
        // 즉, 기계가 내부적으로 데이터를 쪼개고 섞어서 사람이 읽을 수 없는 데이터 덩어리(byte 배열)로 뱉어내기
        byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

        // 암호화된 결과(데이터 덩어리)는 사람이 읽을 수 없는 깨진 글자 형태로
        // 이를 DB에 저장 및 통신하기 좋게 읽을 수 있는 문자열로 변환(인코딩)
        // 6. 가장 중요..!! 복호화를 위해서는 어떻게 흔들었는지(IV)를 알아야 하기 때문에
        // 흔들기 규칙 + 암호 데이터를 하나로 합친 뒤, DB에 저장하거나,
        // 전송하기 좋게 '읽을 수 있는 문자열(Base64)로 예쁘게 포장해서 보내기
        ByteBuffer byteBuffer = ByteBuffer.allocate(iv.length + encrypted.length);
        byteBuffer.put(iv);
        byteBuffer.put(encrypted);
        return Base64.getEncoder().encodeToString(byteBuffer.array());
    }

    // 데이터 복호화
    public String decrypt(String cipherText) throws Exception {
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "AES");
        IvParameterSpec ivSpec = new IvParameterSpec(secretKey.substring(0, 16).getBytes(StandardCharsets.UTF_8));

        cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);
        byte[] decoded = Base64.getDecoder().decode(cipherText);
        byte[] decrypted = cipher.doFinal(decoded);

        return new String(decrypted, StandardCharsets.UTF_8);
    }
}