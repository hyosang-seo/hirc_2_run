# 서울뜀박질 (hirc Running) System

서울뜀박질 러닝 그룹을 위한 출석 체크 및 세션 관리 시스템입니다.

## 🏃‍♂️ 프로젝트 개요

이 시스템은 러닝 세션을 생성하고, QR 코드를 통한 출석 체크, 그리고 멤버 관리를 제공하는 React 기반 웹 애플리케이션입니다.

## ✨ 주요 기능

### 🎯 세션 관리
- **세션 생성**: 새로운 러닝 세션을 생성하고 관리
- **세션 인스턴스**: 특정 날짜의 러닝 세션 인스턴스 생성
- **세션 정보 표시**: 현재 세션의 이름과 정보를 상단에 표시

### 📱 출석 체크 시스템
- **QR 코드 생성**: 세션별 고유 QR 코드 생성
- **QR 코드 스캔**: 참가자가 QR 코드를 스캔하여 출석 체크
- **멤버 인증**: 이름, 휴대전화 뒷 4자리, 멤버 타입으로 인증
- **실시간 업데이트**: 출석 상태를 실시간으로 업데이트

### 👥 멤버 관리
- **멤버 등록**: 서뜀러너(Crew)와 게스트(Guest) 구분하여 등록
- **멤버 목록**: 세션별 참가자 목록 확인
- **출석 상태 관리**: ready, done 상태로 출석 관리

## 🛠️ 기술 스택

- **Frontend**: React 18.3.1
- **Routing**: React Router DOM 6.24.0
- **Database**: Supabase
- **QR Code**: qrcode.react 3.1.0
- **Styling**: CSS3
- **Deployment**: Docker

## 📁 프로젝트 구조

```
src/
├── pages/
│   ├── Main.js                 # 메인 페이지
│   ├── MakeSession.js          # 세션 생성 페이지
│   ├── MakeInstanceSession.js  # 세션 인스턴스 생성
│   ├── QRPage.js              # QR 코드 생성/표시
│   ├── InfoPage.js            # 출석 체크 페이지
│   ├── ManageSessionMember.js # 멤버 관리
│   ├── MemberList.js          # 멤버 목록
│   ├── RunningConfirm.js      # 러닝 확인
│   ├── Done.js                # 완료 페이지
│   ├── QRCodeComponent.js     # QR 코드 컴포넌트
│   └── Supabase.js            # Supabase 설정
├── style/                     # CSS 스타일 파일들
└── App.js                     # 메인 앱 컴포넌트
```

## 🚀 설치 및 실행

### 1. 저장소 클론
```bash
git clone [repository-url]
cd hirc_2_run
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
`.env` 파일을 생성하고 Supabase 설정을 추가하세요:
```env
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 개발 서버 실행
```bash
npm start
```

### 5. Docker로 실행 (선택사항)
```bash
# 개발 환경
docker-compose -f docker-compose.dev.yaml up

# 프로덕션 환경
docker-compose up
```

## 📱 사용 방법

### 세션 생성
1. 메인 페이지에서 "세션 만들기" 클릭
2. 세션 이름과 정보 입력
3. 세션 생성 완료

### 출석 체크
1. QR 코드 페이지에서 세션 선택
2. QR 코드를 참가자에게 공유
3. 참가자가 QR 코드 스캔 후 정보 입력
4. 출석 체크 완료

### 멤버 관리
1. "멤버 관리" 페이지에서 세션 선택
2. 멤버 추가/수정/삭제
3. 출석 상태 확인

## 🗄️ 데이터베이스 스키마

### workout_sessions
- `id`: 세션 ID
- `name`: 세션 이름
- `created_at`: 생성일시

### workout_members
- `id`: 멤버 ID
- `name`: 멤버 이름
- `member_type`: 멤버 타입 (Crew/Guest)
- `session_id`: 세션 ID
- `status`: 출석 상태 (ready/done)
- `secret_number`: 휴대전화 뒷 4자리

## 🔧 개발 스크립트

```bash
npm start          # 개발 서버 실행
npm run build      # 프로덕션 빌드
npm test           # 테스트 실행
npm run eject      # 설정 추출 (주의: 되돌릴 수 없음)
```

## 🌐 배포

### Docker 배포
```bash
# 이미지 빌드
docker build -t hirc-run .

# 컨테이너 실행
docker run -p 8000:8000 hirc-run
```

### 정적 호스팅
```bash
npm run build
# build 폴더의 내용을 웹 서버에 업로드
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

---

**서울뜀박질** - 함께 뛰는 즐거움을 나누는 러닝 커뮤니티 🏃‍♀️🏃‍♂️