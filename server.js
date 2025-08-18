import express from 'express';
import dotenv from 'dotenv';
import pool from './db.js';

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// db test
app.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM test_users');
    res.json(rows);
  } catch (err) {
    console.error('DB 쿼리 오류 ❌', err);
    res.status(500).json({ error: 'DB 오류 발생' });
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