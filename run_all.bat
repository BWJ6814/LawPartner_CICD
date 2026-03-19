@echo off
chcp 65001 > nul

echo.
echo =================================================
echo [AI-Law] 외부 접속 가능한 통합 서버를 기동합니다...
echo =================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

:: ---- 0) 필수 도구 점검 (Java / Maven) ----
if not defined JAVA_HOME (
    if exist "C:\Program Files\Java\jdk-17\bin\java.exe" (
        set "JAVA_HOME=C:\Program Files\Java\jdk-17"
    )
)
if exist "C:\Program Files\Java\jdk-17\bin\java.exe" (
    set "JAVA_HOME=C:\Program Files\Java\jdk-17"
)
if exist "C:\Maven\bin\mvn.cmd" (
    set "MAVEN_HOME=C:\Maven"
)
if exist "C:\Users\human-17\mvn\apache-maven-3.9.14\bin\mvn.cmd" (
    set "MAVEN_HOME=C:\Users\human-17\mvn\apache-maven-3.9.14"
)
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"
if defined MAVEN_HOME set "PATH=%MAVEN_HOME%\bin;%PATH%"

:: 설치 직후 세션 PATH 보정 (대표 경로들)
where java >nul 2>&1
if errorlevel 1 (
    echo [오류] Java를 찾지 못했습니다. JAVA_HOME 또는 PATH를 확인하세요.
    pause
    exit /b 1
)

where mvn >nul 2>&1
if errorlevel 1 (
    echo [오류] Maven을 찾지 못했습니다. C:\Maven\bin 이 PATH에 있는지 확인하세요.
    pause
    exit /b 1
)

:: ---- 1) 포트 충돌 정리 (이미 떠 있는 이전 프로세스 종료) ----
echo [사전 점검] 포트 점유 프로세스 정리(3000/8000/8080)...
for %%P in (3000 8000 8080) do (
    for /f "tokens=5" %%I in ('netstat -ano ^| findstr /r /c:":%%P .*LISTENING"') do (
        if not "%%I"=="0" (
            echo - Port %%P 사용 중 PID %%I 종료
            taskkill /F /PID %%I >nul 2>&1
        )
    )
)

:: ---- 2) Windows 방화벽 인바운드 허용 ----
echo [사전 점검] 방화벽 포트(3000/8000/8080) 허용 규칙 적용...
netsh advfirewall firewall show rule name="AI-Law Frontend 3000" >nul 2>&1 || netsh advfirewall firewall add rule name="AI-Law Frontend 3000" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall show rule name="AI-Law AI 8000" >nul 2>&1 || netsh advfirewall firewall add rule name="AI-Law AI 8000" dir=in action=allow protocol=TCP localport=8000
netsh advfirewall firewall show rule name="AI-Law Backend 8080" >nul 2>&1 || netsh advfirewall firewall add rule name="AI-Law Backend 8080" dir=in action=allow protocol=TCP localport=8080

:: 3) React 실행 (외부 접속 가능: 0.0.0.0)
echo [1/3] React 프론트엔드 시작 중...
start "React Frontend" cmd /k ""%ROOT_DIR%frontend\run.bat""

:: 4) FastAPI 실행 (외부 접속 가능: 0.0.0.0)
echo [2/3] FastAPI AI 서버 시작 중...
start "FastAPI-Server" cmd /k ""%ROOT_DIR%backend-ai\run.bat""

:: 5) Spring Boot 실행 (현재 창)
echo [3/3] Spring Boot 백엔드 시작 중...
cd /d "%ROOT_DIR%Backend-main"

set MAVEN_OPTS=-Dfile.encoding=UTF-8
call mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Dfile.encoding=UTF-8"

pause