# WAVI Backend

부산 관광 및 재난 정보 제공 백엔드 API 서버

## 프로젝트 개요

WAVI는 부산광역시의 관광 정보와 재난 정보(하천 수위, 도로 침수)를 제공하는 통합 백엔드 시스템입니다. RAG(Retrieval-Augmented Generation) 기술을 활용한 AI 챗봇으로 관광지 추천과 안내를 제공하며, 부산시 공공데이터를 연동하여 실시간 재난 정보를 제공합니다.

## 주요 기능

### 1. RAG 기반 관광 가이드 챗봇
- OpenAI GPT-3.5-turbo와 FAISS 벡터 검색을 활용한 지능형 챗봇
- 부산 관광지 데이터베이스 기반 맥락 인식 답변
- 자연어 질의를 통한 관광지 추천 및 정보 제공

### 2. 하천 수위 정보
- 부산시 하천 수위 실시간 조회
- 공공데이터 API 연동을 통한 자동 업데이트
- 수위 상태 및 위험도 정보 제공

### 3. 도로 침수 정보
- 부산시 도로 침수 정보 실시간 조회
- 침수 위험 지역 모니터링
- 침수 수위 및 상태 정보 제공

### 4. 관광지 정보
- 부산 관광지 데이터베이스 조회
- 위치, 연락처, 교통 정보 등 상세 정보 제공

## 기술 스택

### Backend
- **Node.js** + **Express**: 메인 API 서버
- **Python** + **Flask** + **Gunicorn**: RAG 벡터 검색 서버
- **MySQL**: 데이터베이스

### AI/ML
- **OpenAI API**: GPT-3.5-turbo, text-embedding-3-small
- **FAISS**: 벡터 유사도 검색
- **NumPy**: 수치 연산

### DevOps
- **PM2**: 프로세스 관리 및 모니터링
- **dotenv**: 환경 변수 관리

## API 엔드포인트

### 관광 정보

#### `POST /rag`
RAG 챗봇 질의응답

**Request Body:**
```json
{
  "message": "해운대 근처 관광지 추천해줘"
}
```

**Response:**
```json
{
  "answer": "GPT가 생성한 답변",
  "context": "검색된 관광지 정보"
}
```

#### `GET /playground`
관광지 정보 조회

**Response:**
```json
[
  {
    "UC_SEQ": 1,
    "MAIN_TITLE": "관광지명",
    "GUGUN_NM": "구군명",
    "LAT": "위도",
    "LNG": "경도",
    "ADDR1": "주소",
    "CNTCT_TEL": "연락처",
    ...
  }
]
```

### 재난 정보

#### `GET /river/update`
하천 수위 정보 업데이트

공공데이터 API에서 최신 하천 수위 정보를 가져와 데이터베이스를 업데이트합니다.

**Response:**
```json
{
  "message": "하천 수위 정보 최신화 완료 (50건 반영)"
}
```

#### `GET /river-levels`
하천 수위 정보 조회

**Response:**
```json
[
  {
    "siteCode": "지점코드",
    "siteName": "지점명",
    "waterLevel": "수위",
    "dayLevelMax": "일 최고 수위",
    "obsrTime": "관측 시간",
    "sttus": "상태 코드",
    "sttusNm": "상태명"
  }
]
```

#### `GET /road/update`
도로 침수 정보 업데이트

공공데이터 API에서 최신 도로 침수 정보를 가져와 데이터베이스를 업데이트합니다.

**Response:**
```json
{
  "message": "도로 침수 정보 최신화 완료 (50건 반영)"
}
```

#### `GET /road-levels`
도로 침수 정보 조회

**Response:**
```json
[
  {
    "siteCode": "지점코드",
    "siteName": "지점명",
    "fludLevel": "침수 수위",
    "obsrTime": "관측 시간",
    "sttus": "상태 코드",
    "sttusNm": "상태명"
  }
]
```

## 설치 및 실행

### 사전 요구사항
- Node.js 18+
- Python 3.8+
- MySQL 8.0+
- PM2 (프로덕션 환경)

### 환경 변수 설정

`.env` 파일을 생성하고 다음 변수를 설정합니다:

```env
# Database
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_PORT=3306

# API Keys
OPENAI_API_KEY=your_openai_api_key
SERVICE_KEY=your_busan_open_api_key

# Server
PORT=3000
NODE_ENV=development
```

### Node.js 설치

```bash
# 의존성 설치
npm install

# 개발 모드 실행
node server.js
```

### Python 환경 설정

```bash
# 가상환경 생성
python3 -m venv venv

# 가상환경 활성화
source venv/bin/activate  # Linux/Mac
# 또는
venv\Scripts\activate  # Windows

# 의존성 설치
pip install flask mysql-connector-python faiss-cpu numpy openai python-dotenv gunicorn

# Flask 서버 실행
python vectoring.py
```

### PM2로 프로덕션 실행

```bash
# PM2 설치
npm install -g pm2

# 서버 시작 (Node.js + Flask 동시 실행)
pm2 start ecosystem.config.cjs

# 상태 확인
pm2 status

# 로그 확인
pm2 logs

# 서버 중지
pm2 stop all

# 서버 재시작
pm2 restart all
```

## 데이터베이스 스키마

### River_Info (하천 수위 정보)
```sql
CREATE TABLE River_Info (
  siteCode VARCHAR(50) PRIMARY KEY,
  siteName VARCHAR(100),
  waterLevel DECIMAL(10,2),
  dayLevelMax DECIMAL(10,2),
  obsrTime VARCHAR(50),
  sttus VARCHAR(10),
  sttusNm VARCHAR(50)
);
```

### Road_Info (도로 침수 정보)
```sql
CREATE TABLE Road_Info (
  siteCode VARCHAR(50) PRIMARY KEY,
  siteName VARCHAR(100),
  fludLevel DECIMAL(10,2),
  obsrTime VARCHAR(50),
  sttus VARCHAR(10),
  sttusNm VARCHAR(50)
);
```

### Playground (관광지 정보)
```sql
CREATE TABLE Playground (
  UC_SEQ INT PRIMARY KEY,
  MAIN_TITLE VARCHAR(255),
  GUGUN_NM VARCHAR(100),
  LAT DECIMAL(10,7),
  LNG DECIMAL(10,7),
  PLACE VARCHAR(255),
  TITLE VARCHAR(255),
  SUBTITLE VARCHAR(255),
  ADDR1 VARCHAR(255),
  CNTCT_TEL VARCHAR(50),
  TRFC_INFO TEXT,
  HOMEPAGE_URL VARCHAR(255)
);
```

## 프로젝트 구조

```
wavi-be/
├── server.js              # Express 메인 서버
├── db.js                  # MySQL 연결 풀 설정
├── vectoring.py           # Flask RAG 서버
├── river.js               # 하천 수위 데이터 수집 스크립트
├── road.js                # 도로 침수 데이터 수집 스크립트
├── playground.js          # 관광지 데이터 수집 스크립트
├── ecosystem.config.cjs   # PM2 설정 파일
├── package.json           # Node.js 의존성
├── .env                   # 환경 변수 (git에서 제외)
└── venv/                  # Python 가상환경
```

## 개발 가이드

### 새로운 API 엔드포인트 추가

1. `server.js`에 라우트 추가
2. 필요시 `db.js`의 연결 풀 활용
3. 에러 핸들링 구현

### 데이터 수집 스크립트

- `river.js`: 하천 수위 데이터 일회성 수집
- `road.js`: 도로 침수 데이터 일회성 수집
- `playground.js`: 관광지 데이터 일회성 수집

프로덕션에서는 API 엔드포인트(`/river/update`, `/road/update`)를 통해 업데이트하거나, cron job으로 주기적 실행을 권장합니다.

## 외부 API 연동

### 부산광역시 공공데이터
- 하천 수위 정보: `BusanRvrwtLevelInfoService`
- 도로 침수 정보: `BusanWaterImrsnInfoService`
- 관광지 정보: `AttractionService`

### OpenAI API
- 모델: `gpt-3.5-turbo`, `text-embedding-3-small`
- 용도: 챗봇 답변 생성 및 텍스트 임베딩

## 라이선스

ISC

## 기여

이 프로젝트는 부산 관광 및 재난 정보 제공을 위한 백엔드 시스템입니다.
