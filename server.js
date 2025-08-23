import express from 'express';
import dotenv from 'dotenv';
import pool from './db.js';
import cors from 'cors';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 그저 test용 (요런식으로 사용하면 됨)
app.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM test_users');
    res.json(rows);
  } catch (err) {
    console.error('DB 쿼리 오류 ❌', err);
    res.status(500).json({ error: 'DB 오류 발생' });
  }
});

//RAG기능 구현
app.post("/rag", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "message 값이 필요합니다." });
    }
    console.log("RAG호출");
    // Python API 호출
    const response = await fetch("http://52.79.194.171:5000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
    });
    const data = await response.json();

    // OpenAI API 호출 (GPT에게 context + user question 전달)
    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "너는 부산 관광 가이드야. context 기반으로만 답변해." },
          { role: "user", content: `질문: ${message}\n\n참고정보: ${data.context}` }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    const gpt = await completion.json();
    const answer = gpt.choices?.[0]?.message?.content || "답변을 생성할 수 없습니다.";

    res.json({
      context: data.context,
      answer
    });

  } catch (error) {
    console.error("RAG 서버 오류:", error);
    res.status(500).json({ error: "서버 오류 발생" });
  }
});

// 하천 수위 데이터 최신화
app.get('/river/update', async (req, res) => {
  try {
    const url = 'http://apis.data.go.kr/6260000/BusanRvrwtLevelInfoService/getRvrwtLevelInfo';
    const params = {
      serviceKey: process.env.SERVICE_KEY,
      pageNo: 1,
      numOfRows: 50,
      resultType: 'json',
    };

    const response = await axios.get(url, { params });
    const items = response.data?.response?.body?.items?.item || [];

    if (!Array.isArray(items)) {
      return res.status(500).json({ error: "하천 수위 items가 배열이 아님", raw: items });
    }

    let saved = 0;
    for (const item of items) {
      const { siteCode, siteName, waterLevel, dayLevelMax, obsrTime, sttus, sttusNm } = item;

      const sql = `
        INSERT INTO River_Info
        (siteCode, siteName, waterLevel, dayLevelMax, obsrTime, sttus, sttusNm)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          waterLevel = VALUES(waterLevel),
          dayLevelMax = VALUES(dayLevelMax),
          sttus = VALUES(sttus),
          sttusNm = VALUES(sttusNm)
      `;

      await pool.query(sql, [
        siteCode,
        siteName,
        waterLevel,
        dayLevelMax,
        obsrTime,
        sttus,
        sttusNm,
      ]);

      saved++;
    }

    res.json({ message: `하천 수위 정보 최신화 완료 (${saved}건 반영)` });

  } catch (err) {
    console.error("하천 수위 API 에러:", err);
    res.status(500).json({ error: "하천 수위 데이터 업데이트 실패", details: err.message });
  }
});

// 도로 침수 데이터 최신화
app.get('/road/update', async (req, res) => {
  try {
    const url = 'http://apis.data.go.kr/6260000/BusanWaterImrsnInfoService/getWaterImrsnInfo';
    const params = {
      serviceKey: process.env.SERVICE_KEY,
      pageNo: 1,
      numOfRows: 50,
      resultType: 'json',
    };

    const response = await axios.get(url, { params });
    const items = response.data?.response?.body?.items?.item || [];

    if (!Array.isArray(items)) {
      return res.status(500).json({ error: "도로 침수 items가 배열이 아님", raw: items });
    }

    let saved = 0;
    for (const item of items) {
      const { siteCode, siteName, fludLevel, obsrTime, sttus, sttusNm } = item;

      const sql = `
        INSERT INTO Road_Info
        (siteCode, siteName, fludLevel, obsrTime, sttus, sttusNm)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          fludLevel = VALUES(fludLevel),
          sttus = VALUES(sttus),
          sttusNm = VALUES(sttusNm)
      `;

      await pool.query(sql, [
        siteCode,
        siteName,
        fludLevel,
        obsrTime,
        sttus,
        sttusNm,
      ]);

      saved++;
    }

    res.json({ message: `도로 침수 정보 최신화 완료 (${saved}건 반영)` });

  } catch (err) {
    console.error("도로 침수 API 에러:", err);
    res.status(500).json({ error: "도로 침수 데이터 업데이트 실패", details: err.message });
  }
});

// River_info select문
app.get('/river-levels', async (req,res) => {
        try{
                const[river_rows] = await pool.query('SELECT * FROM River_Info ORDER BY obsrTime DESC');
                res.json(river_rows);
        } catch (err){
                console.error('DB 쿼리 오류',err);
                res.status(500).json({error: 'DB오류발생'});
        }
        });

// Road_info select문
app.get('/road-levels', async (req,res) => {                                                                                     
        try{                                                                                                                     
                const[road_rows] = await pool.query('SELECT * FROM Road_Info ORDER BY obsrTime DESC');                           
                res.json(road_rows);                                                                                             
        } catch (err){                                                                                                           
                console.error('DB 쿼리 오류',err);                                                                               
                res.status(500).json({error: 'DB오류발생'});                                                                     
        }                                                                                                                        
});    

// Playground select문
app.get('/playground', async (req,res) => {                                                                                      
        try{                                                                                                                     
                const[playground_rows] = await pool.query('SELECT * FROM Playground ORDER BY UC_SEQ DESC');                      
                res.json(playground_rows);                                                                                       
        } catch (err){                                                                                                           
                console.error('DB 쿼리 오류',err);                                                                               
                res.status(500).json({error: 'DB오류발생'});                                                                     
        }                                                                                                                        
});                                                                                                                              
                                                                                                                                 
async function init() {                                                                                                          
                                                                                                                                 
  try {                                                                                                                            
    const connection = await pool.getConnection(); // 풀에서 연결 가져오기                                                       
    console.log('DB 연결 성공 ✅');                                                                                              
    connection.release(); // 풀에 반환                                                                                           
                                                                                                                                 
    const PORT = process.env.PORT || 3000;                                                                                       
    app.listen(PORT, () => {                                                                                                     
      console.log(`Server running on port ${PORT}`);                                                                             
    });       
    } catch (err) {                                                                                                                
    console.error('DB 연결 실패 ❌', err);                                                                                       
    process.exit(1);                                                                                                             
  }                                                                                                                              
}                                                                                                                                
                                                                                                                                 
init(); 

