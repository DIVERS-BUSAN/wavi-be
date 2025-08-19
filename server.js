import express from 'express';
import dotenv from 'dotenv';
import pool from './db.js';
import cors from 'cors';

dotenv.config();
const app = express();
app.use(cors());
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

app.get('/river-levels', async (req,res) => {
        try{
                const[river_rows] = await pool.query('SELECT * FROM River_Info ORDER BY obsrTime DESC');
                res.json(river_rows);
        } catch (err){
                console.error('DB 쿼리 오류',err);
                res.status(500).json({error: 'DB오류발생'});
        }
        });                                                                                                                              
app.get('/road-levels', async (req,res) => {                                                                                     
        try{                                                                                                                     
                const[road_rows] = await pool.query('SELECT * FROM Road_Info ORDER BY obsrTime DESC');                           
                res.json(road_rows);                                                                                             
        } catch (err){                                                                                                           
                console.error('DB 쿼리 오류',err);                                                                               
                res.status(500).json({error: 'DB오류발생'});                                                                     
        }                                                                                                                        
});                                                                                                                              
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