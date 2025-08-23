from flask import Flask, request, jsonify
import mysql.connector
import faiss
import numpy as np
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()
# --- (0) OpenAI 초기화 ---
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# --- (1) MySQL 연결 ---
db = mysql.connector.connect(
    host=os.getenv("DB_HOST"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database=os.getenv("DB_NAME"),
    port=os.getenv("DB_PORT")
)

cursor = db.cursor(dictionary=True)

# --- (2) Flask 앱 생성 ---
app = Flask(__name__)

# --- (3) DB 데이터 불러와서 벡터화 ---
cursor.execute("SELECT * FROM Playground")
rows = cursor.fetchall()

def build_text(row):
    """DB row를 벡터화할 때 사용할 텍스트"""
    return f"""
    관광지명: {row['MAIN_TITLE']}
    장소: {row['PLACE']}
    설명: {row['TITLE']} / {row['SUBTITLE']}
    주소: {row['ADDR1']}
    교통정보: {row['TRFC_INFO']}
    구군: {row['GUGUN_NM']}
    """.strip()

texts = [build_text(r) for r in rows]

embeddings = []
for text in texts:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    embeddings.append(response.data[0].embedding)

embeddings = np.array(embeddings).astype("float32")

# --- (4) FAISS 인덱스 생성 ---
dimension = len(embeddings[0])  # 임베딩 차원
index = faiss.IndexFlatL2(dimension)
index.add(embeddings)

# UC_SEQ ↔ Index 매핑
id_mapping = {i: rows[i]["UC_SEQ"] for i in range(len(rows))}

# --- (5) 관광지 검색 함수 ---
def search_tourism(query, top_k=3):
    """쿼리와 유사한 관광지 top_k 반환"""
    q_embed = client.embeddings.create(
        model="text-embedding-3-small",
        input=query
    )
    query_vector = np.array([q_embed.data[0].embedding], dtype="float32")

    distances, indices = index.search(query_vector, top_k)

    results = []
    for idx in indices[0]:
        uc_seq = id_mapping[idx]
        cursor.execute("SELECT * FROM Playground WHERE UC_SEQ = %s", (uc_seq,))
        result = cursor.fetchone()
        results.append(result)

    return results

# --- (6) API 엔드포인트 ---
@app.route("/search", methods=["POST"])
def rag_search():
    data = request.json
    query = data.get("message", "")

    if not query:
        return jsonify({"error": "질문이 비어있습니다."}), 400

    # 1) 관광지 후보 검색
    results = search_tourism(query)

    if not results:
        return jsonify({"answer": "관련된 관광지를 찾을 수 없습니다.", "results": []})

    # 2) 후보 텍스트 조립
    context_texts = "\n\n".join([
        f"{r['MAIN_TITLE']} ({r['ADDR1']})\n"
        f"설명: {r['TITLE']} - {r['SUBTITLE']}\n"
        f"전화: {r['CNTCT_TEL']}\n"
        f"홈페이지: {r['HOMEPAGE_URL']}\n"
        f"위도/경도: {r['LAT']}, {r['LNG']}"
        for r in results
    ])

    # 3) GPT에게 요약 답변 생성 요청
    completion = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "너는 부산광역시 관광 안내 AI 비서이다. 아래 참고 문서를 기반으로만 대답하라."},
            {"role": "user", "content": f"사용자 질문: {query}\n\n참고 문서:\n{context_texts}"}
        ],
        max_tokens=500,
        temperature=0.5
    )

    answer = completion.choices[0].message.content

    return jsonify({
        "answer": answer,
        "results": results  # Flutter에서 카드 UI로 활용 가능
    })

# --- (7) 서버 실행 ---
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
    print("서버실행중")

