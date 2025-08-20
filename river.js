import axios from 'axios';
import pool from './db.js';

async function fetchRiverLevel() {
  try {
    const url = 'http://apis.data.go.kr/6260000/BusanRvrwtLevelInfoService/getRvrwtLevelInfo';
    const params = {
            serviceKey:process.env.SERVICE_KEY, 
      pageNo: 2,
      numOfRows: 10,
      resultType: 'json',
    };

    const response = await axios.get(url, { params });
    const data = response.data;
    console.log(JSON.stringify(data, null, 2));
    const items = data?.response?.body?.items?.item || [];
    if (!Array.isArray(items)){
            console.log("items가 배열이 아님",items);
    }

    for (const item of items) {
      const { siteCode, siteName, waterLevel, dayLevelMax, obsrTime, sttus, sttusNm } = item;
      console.log("siteCOde",siteCode);
      const sql = `
        INSERT INTO River_Info
        (siteCode, siteName, waterLevel, dayLevelMax, obsrTime, sttus, sttusNm)
        VALUES (?, ?, ?, ?, ?, ?, ?)
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

      console.log(`저장 완료: ${siteName} (${obsrTime})`);
    }
  } catch (err) {
    console.error("API 호출/DB 저장 에러:", err.message);
  } finally {
    pool.end(); // 실행 끝나면 커넥션 풀 닫기 (단발 실행용)
  }
}

fetchRiverLevel();