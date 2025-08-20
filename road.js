import axios from 'axios';
import pool from './db.js';

      async function fetchRoadLevel() {                                                                                                    try {                                                                                                                                const url = 'http://apis.data.go.kr/6260000/BusanWaterImrsnInfoService/getWaterImrsnInfo';                                       const params = {                                                                                                                     serviceKey:"CUgAdYOLCfoqKexlPeZVx03VXdUx2BkGpmIF0hjRMyUix4QJjJZ21TjP38Xy1IJy27nP06/ETwOGxfX5TEs+tw==", // 서비스>키도 .env에 넣는 게 안전해요
                  pageNo: 1,
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
        const { siteCode, siteName, fludLevel, obsrTime, sttus, sttusNm } = item;
        const sql = `
          INSERT INTO Road_Info
          (siteCode, siteName, fludLevel, obsrTime, sttus, sttusNm)
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        await pool.query(sql, [
          siteCode,
          siteName,
          fludLevel,
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

fetchRoadLevel();