# main.py
import os
import json
from flask import Flask, render_template, request, jsonify, send_file, send_from_directory, Blueprint
import requests # type: ignore
from io import BytesIO
import pymysql # type: ignore
from flask_cors import CORS # type: ignore
import datetime
import re
from bs4 import BeautifulSoup # type: ignore
from urllib.parse import urljoin
import urllib3 # type: ignore
from flask import session
import uuid
import time

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = Flask(__name__)
CORS(app)
app.secret_key = "ai-lounge-secret_key"

# OpenWeatherMap API 정보
WEATHER_API_KEY = "2dc3123de16c3df61202dc8b4f9b0277"
WEATHER_API_URL = "http://api.openweathermap.org/data/2.5/weather"
AIR_API_URL = "http://api.openweathermap.org/data/2.5/air_pollution"

# 실시간 버스 API 정보
BUS_API_KEY = "RGesJ5c4jVDG2WSunyQuIlz5kE43VDbHiUuu4v5Y+ghPU36UfRU+W9eOZsrc3d+ek7+A1slqZTG9gveHwtcEKA=="
BUS_BASE_URL = "https://apis.data.go.kr/6290000/gj_bis"


TYPECAST_API_KEY = "__pltVDgHGsY6Zf9Kr5VJQboHrvMWuCUZu2VY5oadbof9"

TYPECAST_HEADERS = {
    "X-API-KEY": TYPECAST_API_KEY,
    "Content-Type": "application/json"

}

VOICE_ID = "tc_65bb3a1976b69213594357fc"

def warmup():
    try:
        requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "kanana-light",
                "prompt": "",
                "stream": False,
                "keep_alive": "24h"
            },
            timeout=60
        )
        print("Ollama warmup 완료")
    except Exception as e:
        print("Warmup 실패:", e)


#날씨 지역정보
KOREAN_TO_ENGLISH_CITY = {
    "서울": "Seoul",
    "부산": "Busan",
    "대구": "Daegu",
    "인천": "Incheon",
    "광주": "Gwangju",
    "대전": "Daejeon",
    "울산": "Ulsan",
    "세종": "Sejong",
    "경기도": "Gyeonggi-do",
    "강원도": "Gangwon-do",
    "충청북도": "Chungcheongbuk-do",
    "충청남도": "Chungcheongnam-do",
    "전라북도": "Jeollabuk-do",
    "전라남도": "Jeollanam-do",
    "경상북도": "Gyeongsangbuk-do",
    "경상남도": "Gyeongsangnam-do",
    "충북": "Chungcheongbuk-do",
    "충남": "Chungcheongnam-do",
    "전북": "Jeollabuk-do",
    "전남": "Jeollanam-do",
    "경북": "Gyeongsangbuk-do",
    "경남": "Gyeongsangnam-do",
    "제주": "Jeju",
    "제주도": "Jeju"
}

ENGLISH_TO_KOREAN_CITY = {v: k for k, v in KOREAN_TO_ENGLISH_CITY.items()}

#정류장 검색 함수
def search_bus_station(keyword):

    url = f"{BUS_BASE_URL}/stationInfo"

    params = {
        "serviceKey": BUS_API_KEY,
        "resultType": "json"
    }

    try:
        res = requests.get(url,params=params,timeout=10)

        data = res.json()

        stations = (
            data
            .get("RESPONSE", {})
            .get("STATION_LIST", {})
            .get("ITEM", [])
        )

        exact = []

        partial = []

        for station in stations:
            name = station.get("BUSSTOP_NAME", "")
            if keyword == name:
                exact.append(station)
            elif keyword in name:
                partial.append(station)

        # 정확히 일치하는 정류장이 있으면 그것만 반환
        if exact:
            return exact
        return partial

    except Exception as e:
        print("정류장 검색 오류:", e)
    return []

#실시간 도착 정보
def get_bus_arrival(station_id):
    url = f"{BUS_BASE_URL}/arriveInfo"

    params = {
        "serviceKey": BUS_API_KEY,
        "BUSSTOP_ID": station_id,
        "resultType": "json"
    }

    try:
        res = requests.get(
            url,
            params=params,
            timeout=10
        )

        data = res.json()
    
        arrive = data.get("RESPONSE",{})

        arrivals = arrive.get("ARRIVE_LIST",{})

        if isinstance(arrivals,dict):
            return arrivals.get("ITEM",[])
        return arrivals

    except Exception as e:
        print("도착정보 오류:", e)
        return []

# 버스 위치 ID → 정류장 이름 변환

def get_station_name_by_id(busstop_id):

    url = f"{BUS_BASE_URL}/stationInfo"

    params = {
        "serviceKey": BUS_API_KEY,
        "resultType": "json"
    }

    try:
        res = requests.get(url,params=params,timeout=10)

        data = res.json()

        stations = (
            data
            .get("RESPONSE", {})
            .get("STATION_LIST", {})
            .get("ITEM", [])
        )

        for station in stations:
            if str(station["BUSSTOP_ID"]) == str(busstop_id):
                return station["BUSSTOP_NAME"]

    except Exception as e:
        print("정류장 이름 조회 오류:", e)
    return "확인불가"

# 버스 노선 전체 조회
def get_bus_lines():

    url = f"{BUS_BASE_URL}/lineInfo"

    params = {
        "serviceKey": BUS_API_KEY,
        "resultType": "json"
    }

    try:

        res = requests.get(url, params=params, timeout=10)

        data = res.json()

        return (
            data
            .get("RESPONSE", {})
            .get("LINE_LIST", {})
            .get("ITEM", [])
        )

    except Exception as e:
        print(e)
        return []

#버스번호 검색 함수
def search_bus_line(keyword):
    keyword = keyword.replace("번", "")
    keyword = keyword.replace("버스", "")
    keyword = keyword.strip()

    result = []

    for line in get_bus_lines():
        name = str(line.get("LINE_NAME", ""))
        compare = name.replace("번", "")

        if compare == keyword:
            result.append(line)

        elif keyword in compare:
            result.append(line)

    return result

#버스번호 추출 함수
def extract_bus_number(text):

    text = text.replace(" ", "")

    patterns = [
        r"(순환\d+[A-Za-z]?)",
        r"(지원\d+[A-Za-z]?)",
        r"(첨단\d+(?:-\d+)?[A-Za-z]?)",
        r"(수완\d+[A-Za-z]?)",
        r"(\d{1,4}(?:-\d+)?)"

    ]

    for p in patterns:
        m = re.search(p, text)
        if m:
            return m.group(1)
    return None

def get_bus_location(line_id):
    url = f"{BUS_BASE_URL}/busLocationInfo"

    params = {
        "serviceKey": BUS_API_KEY,
        "LINE_ID": line_id,
        "resultType": "json"
    }

    try:

        res = requests.get(url,params=params,timeout=10)

        data = res.json()

        print("버스 위치 API 응답")

        print(data)

        # 실제 응답 구조
        response = data.get("RESPONSE", {})

        location_list = response.get(
            "BUSLOCATION_LIST",
            {}
        )

        if isinstance(location_list, dict):

            return location_list.get(
                "ITEM",
                []
            )

        return []

    except Exception as e:
        print("버스 위치 오류:", e)
        return []

#정류장 추출 함수
def extract_station_name(text):
    # 질문 표현 제거 (정류장명에 포함될 수 있는 "버스" 제외)
    remove_words = [
        "정류장",
        "도착",
        "정보",
        "언제와",
        "언제 와",
        "알려줘",
        "알려 줘",
        "조회",
        "몇 분",
        "몇분",
        "출발"
    ]

    for word in remove_words:
        text = text.replace(word, "")

    # 질문 앞뒤의 버스 표현만 제거
    text = re.sub(r"^버스\s*", "", text) # "버스 광주역"
    text = re.sub(r"\s*버스$", "", text) # "광주역 버스"

    # 특수문자 제거
    text = re.sub(r"[^가-힣a-zA-Z0-9]", "", text)

    return text.strip()


def is_bus_location_question(text):
    keywords = [
        "어디 있어",
        "어디있어",
        "어디에 있어",
        "현재 위치",
        "위치 알려줘",
        "지금 어디",
        "운행 위치",
        "버스 위치",
        "어디",
    ]

    return any(k in text for k in keywords)

def is_bus_route_question(text):
    keywords = [
        "노선",
        "경로",
        "가는 곳",
        "어디까지",
        "첫차",
        "막차",
        "배차"
    ]

    return any(k in text for k in keywords)

# 미세먼지 수치 함수
def get_air_quality_text(aqi):
    return {
        1: "매우 좋음",
        2: "좋음",
        3: "보통",
        4: "나쁨",
        5: "매우 나쁨"
    }.get(aqi, "정보없음")
    
# 날씨 API 호출 함수
def get_weather(user_input=None, intent_code=None, intent_category=None):
    default_city = "광주"
    korean_city = extract_city_name(user_input) if user_input else default_city
    city = KOREAN_TO_ENGLISH_CITY.get(korean_city, "Gwangju")

    weather_params = {
        "q": city,
        "appid": WEATHER_API_KEY,
        "units": "metric",
        "lang": "kr"
    }

    weather_response = requests.get(
        WEATHER_API_URL,
        params=weather_params
    )

    if weather_response.status_code != 200:
        return jsonify({
            "response": f"{korean_city}의 날씨 정보를 가져오지 못했습니다."
        })

    weather = weather_response.json()
    temperature = round(weather["main"]["temp"], 1)
    feels_like = round(weather["main"]["feels_like"], 1)
    temp_min = round(weather["main"]["temp_min"], 1)
    temp_max = round(weather["main"]["temp_max"], 1)
    humidity = weather["main"]["humidity"]
    pressure = weather["main"]["pressure"]
    wind_speed = weather["wind"]["speed"]
    clouds = weather["clouds"]["all"]
    visibility = weather.get("visibility", 0) / 1000
    description = weather["weather"][0]["description"]
    lat = weather["coord"]["lat"]
    lon = weather["coord"]["lon"]
    city_name = weather["name"]

    korean_city_name = ENGLISH_TO_KOREAN_CITY.get(city_name, korean_city)
    
    # 미세먼지 API
    air_response = requests.get(
        AIR_API_URL,
        params={
            "lat": lat,
            "lon": lon,
            "appid": WEATHER_API_KEY
        }
    )

    air_text = ""

    if air_response.status_code == 200:
        air = air_response.json()["list"][0]
        aqi = air["main"]["aqi"]
        pm25 = round(air["components"]["pm2_5"], 1)
        pm10 = round(air["components"]["pm10"], 1)
        air_text = f"""
        <strong>미세먼지 정보</strong>
        😷 대기질 : {get_air_quality_text(aqi)}
        🌫️ 초미세먼지(PM2.5) : {pm25}㎍/㎥
        🌫️ 미세먼지(PM10) : {pm10}㎍/㎥"""

    response = f"""<strong>오늘의 날씨</strong>
    📍 지역 : {korean_city_name}
    ☀️ 날씨 : {description}
    🌡️ 현재기온 : {temperature}°C
    🤗 체감온도 : {feels_like}°C
    ⬆ 최고기온 : {temp_max}°C
    ⬇ 최저기온 : {temp_min}°C
    💧 습도 : {humidity}%
    💨 풍속 : {wind_speed}m/s
    {air_text}"""
    
    tts_text = (
        f"오늘 {korean_city_name}의 날씨를 알려드리겠습니다."
        f"현재 날씨는 {description}이며,"
        f"기온은 {temperature}도, 체감온도는 {feels_like}도입니다."
        f"최고기온은 {temp_max}도, 최저기온은 {temp_min}도입니다."
        f"습도는 {humidity}퍼센트이고, 풍속은 초속 {wind_speed}미터입니다."
    )

    if air_response.status_code == 200:
        tts_text += (
            f"미세먼지는 {get_air_quality_text(aqi)} 수준입니다."
            f"초미세먼지는 {pm25} 마이크로그램,"
            f"미세먼지는 {pm10} 마이크로그램입니다."
        )

    return qa_response(
        question=user_input,
        answer=response,
        intent_code=intent_code,
        intent_category=intent_category,
        response_source="OpenWeather API",
        response_success=True,
        tts_text=tts_text
    )

# 사용자 입력에서 도시명 추출
def extract_city_name(user_input):
    for city in KOREAN_TO_ENGLISH_CITY.keys():
        if city in user_input:
            return city

    return "광주" 

def is_date_question(user_input):
    date_patterns = [
        r"오늘 날짜", 
        r"오늘 몇 월 며칠", 
        r"오늘 며칠", 
        r"지금 날짜", 
        r"오늘은 무슨 요일", 
        r"무슨 날",
        r"날짜",
        r"몇월 며칠",
        r"몇월",
        r"며칠",
        r"몇 월",
        r"요일"     
    ]
    
    for pattern in date_patterns:
        if re.search(pattern, user_input):
            return True
    return False

def is_time_question(user_input):
    time_patterns = [
        r"몇 시", 
        r"몇 분",
        r"지금 몇 시", 
        r"현재 시간", 
        r"몇시",
        r"몇분",
        r"지금 시간"
    ]
    
    for pattern in time_patterns:
        if re.search(pattern, user_input):
            return True
    return False
    
def get_korean_weekday(weekday_index):
    weekdays = ["월요일", "화요일", "수요일", "목요일", "금요일", "토요일", "일요일"]
    return weekdays[weekday_index]

# =========================
# DB 연결 함수
# SQL 연동 에러 뜨면 터미널에서 brew services start mysql@8.4 실행 후 brew services list 로 started 확인하기
# =========================

def get_db():

    return pymysql.connect(
        host="127.0.0.1",
        user="root", #서버: ailounge
        password="",
        database="smart_data",
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor
    )

# ==========================================
# 관리자 로그 조회 API
# session_log / satisfaction_log / qa_log / ai_usage_log
# ==========================================

from flask import jsonify, request, render_template


ADMIN_LOG_TABLES = {
    "session": "session_log",
    "satisfaction": "satisfaction_log",
    "qa": "qa_log",
    "usage": "ai_usage_log",
}

# 로그 테이블에서 날짜 컬럼을 찾을 때 확인할 후보
ADMIN_DATE_COLUMNS = [
    "started_at",
    "created_at",
    "submitted_at",
    "logged_at",
    "timestamp",
    "created_on",
    "updated_at",
]


def get_admin_table_info(cursor, table_name):
    """
    허용된 테이블의 실제 컬럼과 날짜 컬럼을 확인한다.
    """
    if table_name not in ADMIN_LOG_TABLES.values():
        raise ValueError("허용되지 않은 로그 테이블입니다.")

    cursor.execute(f"SHOW COLUMNS FROM `{table_name}`")
    columns = cursor.fetchall()

    column_names = [column["Field"] for column in columns]

    date_column = next(
        (
            name for name in ADMIN_DATE_COLUMNS
            if name in column_names
        ),
        None
    )

    return column_names, date_column


def admin_date_condition(date_column, period):
    """
    날짜 필터용 SQL 조건과 파라미터를 반환한다.
    date_column은 DB에서 확인한 컬럼명만 사용한다.
    """
    if not date_column or period == "all":
        return "", []

    if period == "today":
        return f"DATE(`{date_column}`) = CURDATE()", []

    if period in ("7", "30"):
        days = int(period)

        return (
            f"`{date_column}` >= DATE_SUB(NOW(), INTERVAL %s DAY)",
            [days]
        )

    return "", []


def normalize_admin_log(log_type, row, date_column):
    """
    DB 행을 프런트엔드 테이블에서 사용할 형태로 변환한다.
    실제 DB에 없는 값은 임의로 만들지 않는다.
    """
    date_value = row.get(date_column) if date_column else None

    if date_value is not None and hasattr(date_value, "isoformat"):
        date_value = date_value.isoformat(sep=" ", timespec="seconds") \
            if hasattr(date_value, "hour") else date_value.isoformat()

    if log_type == "session":
        return {
            "id": row.get("id"),
            "date": date_value,
            "sessionId": row.get("session_id"),
            "path": row.get("entry_path"),
            "service": row.get("service_type"),
            "duration": row.get("duration_sec"),
            "status": row.get("exit_stage"),
        }

    if log_type == "satisfaction":
        return {
            "id": row.get("id"),
            "date": date_value,
            "sessionId": row.get("session_id"),
            "score": row.get("satisfaction_score"),
            "reuse": row.get("reuse_intention"),
            "understanding": row.get("understanding_score"),
            "comment": row.get("free_comment"),
        }

    if log_type == "qa":
        success = row.get("response_success")

        if success is not None:
            success = "성공" if str(success) in ("1", "True", "true") else "실패"

        return {
            "id": row.get("query_id"),
            "date": date_value,
            "sessionId": row.get("session_id"),
            "question": row.get("query_text"),
            "intent": row.get("intent_category") or row.get("intent_code"),
            "source": row.get("response_source"),
            "success": success,
            "retries": row.get("retry_count"),
        }

    if log_type == "usage":
        return {
            "id": row.get("id"),
            "date": date_value,
            "sessionId": row.get("session_id"),
            "service": row.get("service"),
            "question": row.get("question"),
        }

    return {}


@app.route("/admin/logs")
def admin_logs_page():
    # 관리자 화면 진입 시 서비스 이용 로그를 추가하지 않는다.
    return render_template("logs.html")


@app.route("/api/admin/logs/<log_type>")
def admin_logs_api(log_type):
    """
    예:
    GET /api/admin/logs/session?period=7
    GET /api/admin/logs/qa?period=today
    """
    if log_type not in ADMIN_LOG_TABLES:
        return jsonify({
            "success": False,
            "message": "지원하지 않는 로그 유형입니다."
        }), 400

    table_name = ADMIN_LOG_TABLES[log_type]
    period = request.args.get("period", "all")

    if period not in ("all", "today", "7", "30"):
        return jsonify({
            "success": False,
            "message": "잘못된 기간 값입니다."
        }), 400

    conn = None
    cursor = None

    try:
        conn = get_db()
        cursor = conn.cursor()

        columns, date_column = get_admin_table_info(
            cursor,
            table_name
        )

        where_sql, params = admin_date_condition(
            date_column,
            period
        )

        # 검색 대상 컬럼은 실제 존재하는 컬럼만 사용한다.
        search = request.args.get("search", "").strip()

        searchable_columns = {
            "session": [
                "session_id", "entry_path",
                "service_type", "exit_stage"
            ],
            "satisfaction": [
                "session_id", "reuse_intention", "free_comment"
            ],
            "qa": [
                "query_id", "session_id", "query_text",
                "intent_code", "intent_category", "response_source"
            ],
            "usage": [
                "session_id", "service", "question"
            ],
        }[log_type]

        searchable_columns = [
            col for col in searchable_columns
            if col in columns
        ]

        if search and searchable_columns:
            search_sql = " OR ".join(
                f"`{col}` LIKE %s"
                for col in searchable_columns
            )

            if where_sql:
                where_sql += f" AND ({search_sql})"
            else:
                where_sql = f"({search_sql})"

            params.extend([f"%{search}%"] * len(searchable_columns))

        sql = f"SELECT * FROM `{table_name}`"

        if where_sql:
            sql += f" WHERE {where_sql}"

        if date_column:
            sql += f" ORDER BY `{date_column}` DESC"


        cursor.execute(sql, params)
        rows = cursor.fetchall()

        logs = [
            normalize_admin_log(log_type, row, date_column)
            for row in rows
        ]

        return jsonify({
            "success": True,
            "type": log_type,
            "count": len(logs),
            "logs": logs
        })

    except Exception as e:
        app.logger.exception("관리자 로그 조회 실패")

        return jsonify({
            "success": False,
            "message": "로그 조회 중 오류가 발생했습니다."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
            
# ==========================================
# 📊 관리자 대시보드 집계 API
# ==========================================

from datetime import date, timedelta


def get_dashboard_date_column(cursor, table_name):
    """
    테이블에 실제 존재하는 날짜 컬럼을 확인한다.
    테이블명은 아래에서 지정한 고정 목록만 사용한다.
    """
    cursor.execute(f"SHOW COLUMNS FROM `{table_name}`")
    columns = {row["Field"] for row in cursor.fetchall()}

    candidates = {
        "session_log": ["started_at"],
        "ai_usage_log": ["created_at"],
        "qa_log": ["created_at"],
        "satisfaction_log": ["created_at"],
    }

    for column in candidates.get(table_name, []):
        if column in columns:
            return column

    # 테이블별 기본 후보가 없을 때 실제 컬럼 목록을 확인한다.
    for column in ["created_at", "started_at", "logged_at", "timestamp"]:
        if column in columns:
            return column

    return None


def get_dashboard_period_condition(date_column, period):
    """
    선택한 기간에 맞는 SQL 조건과 파라미터를 반환한다.
    날짜 컬럼은 SHOW COLUMNS로 확인한 이름만 사용한다.
    """
    if period == "all":
        return "", ()

    if period == "today":
        return f" AND `{date_column}` >= %s AND `{date_column}` < %s", (
            date.today(),
            date.today() + timedelta(days=1),
        )

    if period in ("7", "30"):
        days = int(period)
        start_date = date.today() - timedelta(days=days - 1)

        return f" AND `{date_column}` >= %s AND `{date_column}` < %s", (
            start_date,
            date.today() + timedelta(days=1),
        )

    return "", ()


@app.route("/api/admin/dashboard")
def admin_dashboard_api():
    period = request.args.get("period", "all")

    if period not in ("all", "today", "7", "30"):
        return jsonify({
            "success": False,
            "message": "지원하지 않는 조회 기간입니다."
        }), 400

    conn = None
    cursor = None

    try:
        conn = get_db()
        cursor = conn.cursor()

        # 각 테이블의 실제 날짜 컬럼을 확인한다.
        date_columns = {
            table: get_dashboard_date_column(cursor, table)
            for table in [
                "session_log",
                "ai_usage_log",
                "qa_log",
                "satisfaction_log",
            ]
        }

        missing = [
            table for table, column in date_columns.items()
            if column is None and period != "all"
        ]

        if missing:
            return jsonify({
                "success": False,
                "message": (
                    "기간 필터에 사용할 날짜 컬럼을 찾지 못했습니다: "
                    + ", ".join(missing)
                )
            }), 500

        def get_condition(table):
            column = date_columns[table]

            if column is None:
                return "", ()

            return get_dashboard_period_condition(column, period)

        # 1. 전체 세션 수
        condition, params = get_condition("session_log")
        cursor.execute(
            f"""
            SELECT COUNT(*) AS total
            FROM session_log
            WHERE 1=1 {condition}
            """,
            params,
        )
        sessions = cursor.fetchone()["total"] or 0

        # 2. 서비스 이용 횟수
        # '방문 세션'은 서비스 이용 횟수에서 제외한다.
        condition, params = get_condition("ai_usage_log")
        cursor.execute(
            f"""
            SELECT COUNT(*) AS total
            FROM ai_usage_log
            WHERE service != '방문 세션'
            {condition}
            """,
            params,
        )
        usage = cursor.fetchone()["total"] or 0

        # 3. QA 응답 성공률
        condition, params = get_condition("qa_log")
        cursor.execute(
            f"""
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(response_success = 1), 0) AS successes
            FROM qa_log
            WHERE 1=1 {condition}
            """,
            params,
        )
        qa = cursor.fetchone()

        qa_total = qa["total"] or 0
        qa_successes = qa["successes"] or 0
        success_rate = (
            round(qa_successes / qa_total * 100, 1)
            if qa_total else 0
        )

        # 4. 평균 만족도
        condition, params = get_condition("satisfaction_log")
        cursor.execute(
            f"""
            SELECT AVG(satisfaction_score) AS average
            FROM satisfaction_log
            WHERE 1=1 {condition}
            """,
            params,
        )
        satisfaction_row = cursor.fetchone()
        satisfaction_avg = satisfaction_row["average"]

        satisfaction_avg = (
            round(float(satisfaction_avg), 1)
            if satisfaction_avg is not None else 0
        )

        # 5. 날짜별 서비스 이용 추이
        condition, params = get_condition("ai_usage_log")
        usage_date_column = date_columns["ai_usage_log"]

        if usage_date_column:
            cursor.execute(
                f"""
                SELECT
                    DATE(`{usage_date_column}`) AS log_date,
                    COUNT(*) AS total
                FROM ai_usage_log
                WHERE service != '방문 세션'
                {condition}
                GROUP BY DATE(`{usage_date_column}`)
                ORDER BY log_date ASC
                """,
                params,
            )

            usage_trend = [
                {
                    "date": row["log_date"].strftime("%m/%d"),
                    "count": int(row["total"] or 0),
                }
                for row in cursor.fetchall()
                if row["log_date"] is not None
            ]
        else:
            usage_trend = []

        # 6. 서비스 유형별 이용 횟수
        condition, params = get_condition("ai_usage_log")
        cursor.execute(
            f"""
            SELECT service, COUNT(*) AS total
            FROM ai_usage_log
            WHERE service IS NOT NULL
              AND service != ''
              AND service != '방문 세션'
            {condition}
            GROUP BY service
            ORDER BY total DESC
            """,
            params,
        )

        service_breakdown = [
            {
                "name": row["service"],
                "count": int(row["total"] or 0),
            }
            for row in cursor.fetchall()
        ]

        return jsonify({
            "success": True,
            "period": period,
            "stats": {
                "sessions": int(sessions),
                "usage": int(usage),
                "qaSuccessRate": success_rate,
                "satisfaction": satisfaction_avg,
            },
            "usageTrend": usage_trend,
            "serviceBreakdown": service_breakdown,
        })

    except Exception as e:
        app.logger.exception("대시보드 집계 조회 오류")
        return jsonify({
            "success": False,
            "message": "대시보드 집계 조회 중 오류가 발생했습니다."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            
# ==========================================
# 📊 실증 데이터 로그
# D1. 이용 세션 로그
# ==========================================

SITE_CODE = "SITE-01"


def get_session_id():
    """
    현재 브라우저 세션의 session_id를 가져온다.
    없으면 새 UUID를 생성한다.
    """

    if "session_id" not in session:
        session["session_id"] = str(uuid.uuid4())

    return session["session_id"]


def create_session(entry_path="touch"):
    """
    새로운 이용 세션을 생성한다.
    """

    session_id = get_session_id()

    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT id
            FROM session_log
            WHERE session_id = %s
            """,
            (session_id,)
        )

        existing = cursor.fetchone()

        if not existing:

            cursor.execute(
                """
                INSERT INTO session_log
                (
                    session_id,
                    site_code,
                    started_at,
                    last_activity_at,
                    entry_path
                )
                VALUES (%s, %s, NOW(), NOW(), %s)
                """,
                (
                    session_id,
                    SITE_CODE,
                    entry_path
                )
            )

            conn.commit()

        conn.close()

    except Exception as e:
        print("세션 생성 오류:", e)

    return session_id

def end_session(exit_stage="SURVEY_COMPLETE"):

    session_id = session.get("session_id")

    if not session_id:
        return False

    conn = None
    cursor = None

    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            UPDATE session_log
            SET
                last_activity_at = NOW(),
                duration_sec = TIMESTAMPDIFF(
                    SECOND,
                    started_at,
                    NOW()
                ),
                exit_stage = %s
            WHERE session_id = %s
            """,
            (
                exit_stage,
                session_id
            )
        )

        conn.commit()

        # DB 저장이 성공한 경우에만 세션 제거
        session.pop("session_id", None)

        print(f"세션 종료 완료: {session_id}")

        return True

    except Exception as e:

        if conn:
            conn.rollback()

        print("세션 종료 오류:", e)

        return False

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()
            
def update_session(service=None, exit_stage=None):
    """
    사용자가 서비스를 이용할 때마다 세션 정보를 업데이트한다.
    """

    session_id = get_session_id()

    try:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            """
            SELECT started_at
            FROM session_log
            WHERE session_id = %s
            """,
            (session_id,)
        )

        row = cursor.fetchone()

        if not row:
            create_session()

            cursor.execute(
                """
                SELECT started_at
                FROM session_log
                WHERE session_id = %s
                """,
                (session_id,)
            )

            row = cursor.fetchone()

        started_at = row["started_at"]

        if service:

            cursor.execute(
                """
                SELECT service_type
                FROM session_log
                WHERE session_id = %s
                """,
                (session_id,)
            )

            current = cursor.fetchone()

            current_services = current["service_type"] if current else ""

            if current_services:
                services = current_services.split(",")

                if service not in services:
                    services.append(service)

                service_type = ",".join(services)

            else:
                service_type = service

        else:
            service_type = None

        cursor.execute(
            """
            UPDATE session_log
            SET
                last_activity_at = NOW(),
                duration_sec = TIMESTAMPDIFF(
                    SECOND,
                    started_at,
                    NOW()
                ),
                service_type = COALESCE(%s, service_type),
                exit_stage = COALESCE(%s, exit_stage)
            WHERE session_id = %s
            """,
            (
                service_type,
                exit_stage,
                session_id
            )
        )

        conn.commit()
        conn.close()

    except Exception as e:
        print("세션 업데이트 오류:", e)

# ==========================================
# 🔐 질의 텍스트 익명화
# ==========================================

def anonymize_text(text):

    if not text:
        return ""

    # 전화번호
    text = re.sub(
        r"(01[016789])[-.\s]?\d{3,4}[-.\s]?\d{4}",
        "[전화번호]",
        text
    )

    # 이메일
    text = re.sub(
        r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}",
        "[이메일]",
        text
    )

    # 주민등록번호
    text = re.sub(
        r"\d{6}[-.\s]?\d{7}",
        "[주민등록번호]",
        text
    )

    # 카드번호
    text = re.sub(
        r"\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}",
        "[카드번호]",
        text
    )

    return text

# ==========================================
# 💬 D2. 질의응답 로그
# ==========================================

def save_qa_log(
    question,
    answer,
    intent_code=None,
    intent_category=None,
    response_source=None,
    response_success=True,
    retry_count=0
):

    session_id = get_session_id()

    safe_question = anonymize_text(question)

    try:
        conn = get_db()
        cursor = conn.cursor()

        query_id = str(uuid.uuid4())

        cursor.execute(
            """
            INSERT INTO qa_log
            (
                query_id,
                session_id,
                query_text,
                intent_code,
                intent_category,
                response_source,
                response_success,
                retry_count
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                query_id,
                session_id,
                safe_question,
                intent_code,
                intent_category,
                response_source,
                1 if response_success else 0,
                retry_count
            )
        )

        conn.commit()
        conn.close()

        print(
            f"[QA LOG] "
            f"{query_id} | "
            f"{intent_code} | "
            f"{response_source}"
        )

    except Exception as e:
        print("질의응답 로그 저장 오류:", e)

def qa_response(
    question,
    answer,
    intent_code=None,
    intent_category=None,
    response_source=None,
    response_success=True,
    retry_count=0,
    **kwargs
):

    save_qa_log(
        question=question,
        answer=answer,
        intent_code=intent_code,
        intent_category=intent_category,
        response_source=response_source,
        response_success=response_success,
        retry_count=retry_count
    )

    update_session()

    return jsonify({
        "response": answer,
        **kwargs
    })     

@app.route("/survey/submit", methods=["POST"])
def submit_survey():

    data = request.get_json() or {}

    satisfaction = data.get("satisfaction")
    reuse_intention = data.get("reuse_intention")
    understanding = data.get("understanding")
    free_comment = data.get("free_comment", "")

    # 필수값 확인
    if not satisfaction:
        return jsonify({
            "success": False,
            "message": "만족도를 선택해주세요."
        }), 400

    if not reuse_intention:
        return jsonify({
            "success": False,
            "message": "재이용 의향을 선택해주세요."
        }), 400

    if not understanding:
        return jsonify({
            "success": False,
            "message": "이해 용이성을 선택해주세요."
        }), 400


    session_id = session.get("session_id")

    if not session_id:
        return jsonify({
            "success": False,
            "message": "체험 세션을 찾을 수 없습니다."
        }), 400


    try:

        conn = get_db()

        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO satisfaction_log
            (
                session_id,
                satisfaction_score,
                reuse_intention,
                understanding_score,
                free_comment
            )
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                session_id,
                satisfaction,
                reuse_intention,
                understanding,
                free_comment
            )
        )

        conn.commit()

        cursor.close()
        conn.close()


        # 설문 완료 → 세션 종료
        ended = end_session("SURVEY_COMPLETE")

        if not ended:
            return jsonify({
                "success": False,
                "message": "세션 종료 처리 중 오류가 발생했습니다."
            }), 500

        return jsonify({
            "success": True
        })


    except Exception as e:

        print("설문 저장 오류:", e)

        return jsonify({
            "success": False,
            "message": "설문 저장 중 오류가 발생했습니다."
        }), 500

def save_usage(service, question=""):

    try:
        conn = get_db()

        cursor = conn.cursor()

        if "session_id" not in session:
            session["session_id"] = str(uuid.uuid4())

        sql = """
        INSERT INTO ai_usage_log
        (session_id, service, question)
        VALUES (%s,%s,%s)
        """

        cursor.execute(
            sql,
            (session["session_id"],service,question)
        )

        conn.commit()

        conn.close()

    except Exception as e:
        print("이용기록 저장 오류:", e)

@app.route("/api/service_usage", methods=["POST"])
def service_usage():

    data = request.json

    service = data.get("service")

    if service:
        save_usage(service)

    return jsonify({
        "success": True
    })

def fetch_all(table_name):
    try:
        conn = get_db()
        cursor = conn.cursor()
        # 안전하게 테이블명 제한 (중요)
        allowed_tables = [
            "cctv",
            "bitgoeul_stats",
            "rental_apartment",
            "temporary_parking_restriction",
            "public_parking",
            "renewable_energy",
            "solar_power_plant",
            "ev_charging_station"
        ]

        if table_name not in allowed_tables:

            return []

        sql = f"SELECT * FROM `{table_name}`"
        cursor.execute(sql)
        result = cursor.fetchall()
        conn.close()

        return result

    except Exception as e:

        print(f"[DB ERROR] {table_name}:", e)

        return []

# =========================
# 1. CCTV
# =========================
@app.route("/api/cctv")
def cctv():
    return jsonify(fetch_all("cctv"))

# =========================
# 2. 빛고을
# =========================
@app.route("/api/bitgoeul_stats")
def bitgoeul_stats():
    return jsonify(fetch_all("bitgoeul_stats"))

# =========================
# 3. 임대아파트
# ========================
@app.route("/api/rental_apartment")
def rental_apartment():
    return jsonify(fetch_all("rental_apartment"))

# =========================
# 4. 주차제한
# =========================
@app.route("/api/temporary_parking_restriction")
def temporary_parking_restriction():
  return jsonify(fetch_all("temporary_parking_restriction"))

# =========================
# 5. 공영주차장
# =========================
@app.route("/api/public_parking")
def public_parking():
    return jsonify(fetch_all("public_parking"))

# =========================
# 6. 신재생에너지
# =========================
@app.route("/api/renewable_energy")
def renewable_energy():
    return jsonify(fetch_all("renewable_energy"))

# =========================
# 7. 태양광
# =========================
@app.route("/api/solar_power_plant")
def solar_power_plant():
    return jsonify(fetch_all("solar_power_plant"))

# =========================
# 8. 전기차 충전소
# =========================
@app.route("/api/ev_charging_station")
def ev_charging_station():
    return jsonify(fetch_all("ev_charging_station"))


# ==========================================
# ⚙️ Ollama 및 기타 설정 
# ==========================================
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "kanana-light:latest"
FORBIDDEN_WORDS = {"바보", "멍청이", "욕설"} 

# ==========================================
# 🌐 페이지 라우팅
# ==========================================
@app.route('/')
def home():
    create_session(entry_path="touch")
    save_usage("방문 세션")
    update_session(service="홈", exit_stage="HOME")
    return render_template('index.html', active_page='home')

@app.route('/voice')
def voice():
    create_session()
    save_usage("음성 서비스")
    update_session(service="음성 서비스", exit_stage="VOICE")
    return render_template('voice.html', active_page='voice')

@app.route("/chat")
def chat():
    create_session()
    save_usage("채팅 서비스")
    update_session(service="채팅 서비스", exit_stage="CHAT")
    return render_template("chat.html", active_page="chat")

@app.route('/dashboard')
def dashboard():
    create_session()
    save_usage("대시보드")
    update_session(service="대시보드", exit_stage="DASHBOARD")
    return render_template('dashboard.html', active_page='dashboard')

@app.route('/map')
def map():
    create_session()
    save_usage("지도 서비스")
    update_session(service="지도 서비스", exit_stage="MAP")
    return render_template('map.html', active_page='map')

@app.route("/games")
def games():
    return render_template("games.html")

@app.route("/game1")
def game1():
    return render_template("game1.html")

@app.route("/game2")
def game2():
    return render_template("game2.html")


@app.route("/api/jeonil_events")
def jeonil_events():
    return jsonify(crawl_jeonil_events())

@app.route("/api/gwangju_events")
def gwangju_events():
    return jsonify(crawl_gwangju_events())

@app.route('/manifest.json')
def manifest():
    return send_from_directory('.', 'manifest.json', mimetype='application/json')


# service-worker.js 루트에서 접근 가능하게 처리
@app.route('/service-worker.js')
def service_worker():
    return send_from_directory('.', 'service-worker.js', mimetype='application/javascript')


@app.route("/api/smart-city-quizzes", methods=["GET"])
def get_smart_city_quizzes():

    file_path = os.path.join(
        os.path.dirname(__file__),
        "data",
        "quiz_data.json"
    )

    print("[Quiz] JSON 경로:", file_path)

    try:

        with open(file_path, "r", encoding="utf-8") as f:
            quizzes = json.load(f)

        print(f"[Quiz] {len(quizzes)}개 문제 로드")

        return jsonify(quizzes)

    except FileNotFoundError:

        print("[Quiz] quiz_data.json 파일을 찾을 수 없습니다.")

        return jsonify({
            "error": "quiz_data.json 파일을 찾을 수 없습니다."
        }), 500

    except json.JSONDecodeError as e:

        print(f"[Quiz] JSON 형식 오류: {e}")

        return jsonify({
            "error": "quiz_data.json 형식이 올바르지 않습니다."
        }), 500

    except Exception as e:

        print(f"[Quiz] 데이터 로드 오류: {e}")

        return jsonify({
            "error": "퀴즈 데이터를 불러오지 못했습니다."
        }), 500
        
        
GIE_API = "https://lms.gie.kr/api/rag/recommend/personalized"

@app.route("/api/gie_courses")

def gie_courses():

    try:
        res = requests.get(
            GIE_API,
            
            params={
                "limit": 8,
                "online_ratio": 0.375
            },

            headers={
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json",
                "Referer": "https://lms.gie.kr/"
            },
            timeout=10,
            verify=False      # SSL 때문에
        )

        data = res.json()

        courses = []

        for item in data.get("courses", []):
            course_url = item.get("ext_uri")

            if not course_url:

                course_url = f"https://lms.gie.kr/cws/{item.get('cw_uuid')}"
    
            thumb = item.get("thumbnail_image_url") or ""

            if thumb.startswith("/"):
                thumb = "https://lms.gie.kr" + thumb

            courses.append({
                "title": item["title"],
                "institution": item["institution"],
                "instructor": item["instructor"],
                "category": item["category"],
                "type": item["type"],
                "image": thumb,
                "url": course_url
            })

        return jsonify(courses)

    except Exception as e:

        print(e)

        return jsonify([])


dashboard_keywords = {
    "공영주차장": {
        "text": "현재 광주 공영 주차장 정보를 확인할 수 있습니다.",
        "title": "주차장 현황 자세히 보기",
        "url": "/map"
    },
    "전기차 충전소": {
        "text": "광주 지역 전기차 충전소 위치와 충전 현황을 확인할 수 있습니다.",
        "title": "충전소 현황 자세히 보기",
        "url": "/map"
    },
    "태양광 발전소": {
        "text": "광주 태양광 발전소 위치와 발전 용량 정보를 확인할 수 있습니다.",
        "title": "태양광 발전소 자세히 보기",
        "url": "/dashboard"
    },
    "신재생에너지": {
        "text": "광주 신재생에너지 현황과 발전 데이터를 확인할 수 있습니다.",
        "title": "에너지 현황 자세히 보기",
        "url": "/dashboard"
    },
    "임대아파트 스프링클러": {
        "text": "임대아파트 스프링클러 설치 현황을 확인할 수 있습니다.",
        "title": "스프링클러 현황 자세히 보기",
        "url": "/dashboard"
    }
}

INTENT_RULES = {

    # =========================
    # 행정
    # =========================
    "INT-A01": {
        "category": "행정",
        "keywords": [
            "민원", "행정", "주민센터", "구청", "시청"
        ]
    },
    "INT-A02": {
        "category": "행정",
        "keywords": [
            "세금", "지방세", "자동차세", "재산세"
        ]
    },
    "INT-A03": {
        "category": "행정",
        "keywords": [
            "지원금", "지원사업", "정책", "지원 제도"
        ]
    },
    "INT-A04": {
        "category": "행정",
        "keywords": [
            "공공기관", "행정기관", "공공서비스"
        ]
    },

    # =========================
    # 복지
    # =========================
    "INT-B01": {
        "category": "복지",
        "keywords": [
            "복지", "복지제도", "복지 혜택"
        ]
    },
    "INT-B02": {
        "category": "복지",
        "keywords": [
            "복지관", "복지시설", "복지센터"
        ]
    },
    "INT-B03": {
        "category": "복지",
        "keywords": [
            "어르신", "노인", "장애인"
        ]
    },
    "INT-B04": {
        "category": "복지",
        "keywords": [
            "아동", "청년", "청소년"
        ]
    },

    # =========================
    # 교통
    # =========================
    "INT-C01": {
        "category": "교통",
        "keywords": [
            "버스", "정류장", "버스 도착"
        ]
    },
    "INT-C02": {
        "category": "교통",
        "keywords": [
            "주차", "주차장", "공영주차장"
        ]
    },
    "INT-C03": {
        "category": "교통",
        "keywords": [
            "교통시설", "신호등", "횡단보도"
        ]
    },
    "INT-C04": {
        "category": "교통",
        "keywords": [
            "교통정보", "교통 상황", "교통량"
        ]
    },

    # =========================
    # 에너지
    # =========================
    "INT-D01": {
        "category": "에너지",
        "keywords": [
            "신재생", "재생에너지"
        ]
    },
    "INT-D02": {
        "category": "에너지",
        "keywords": [
            "태양광", "태양광 발전"
        ]
    },
    "INT-D03": {
        "category": "에너지",
        "keywords": [
            "전기차", "충전소", "충전기"
        ]
    },
    "INT-D04": {
        "category": "에너지",
        "keywords": [
            "에너지 절약", "에너지 절감", "전력"
        ]
    },

    # =========================
    # 안전
    # =========================
    "INT-E01": {
        "category": "안전",
        "keywords": [
            "CCTV", "방범"
        ]
    },
    "INT-E02": {
        "category": "안전",
        "keywords": [
            "재난", "재해", "홍수", "태풍", "폭염"
        ]
    },
    "INT-E03": {
        "category": "안전",
        "keywords": [
            "안전시설", "비상벨", "소화전"
        ]
    },
    "INT-E04": {
        "category": "안전",
        "keywords": [
            "생활안전", "위험"
        ]
    },

    # =========================
    # 문화
    # =========================
    "INT-F01": {
        "category": "문화",
        "keywords": [
            "문화행사", "문화"
        ]
    },
    "INT-F02": {
        "category": "문화",
        "keywords": [
            "관광", "여행", "관광지"
        ]
    },
    "INT-F03": {
        "category": "문화",
        "keywords": [
            "교육", "문화시설", "도서관", "박물관"
        ]
    },
    "INT-F04": {
        "category": "문화",
        "keywords": [
            "축제", "공연", "콘서트"
        ]
    }
}

def classify_intent(text):
    text = text.strip().lower()
    for intent_code, info in INTENT_RULES.items():
        for keyword in info["keywords"]:
            if keyword.lower() in text:
                return {
                    "intent_code": intent_code,
                    "intent_category": info["category"]
                }
    # 분류되지 않은 경우
    return {
        "intent_code": None,
        "intent_category": None
    }

#이용현황 API
@app.route("/api/usage_stats")
def usage_stats():

    conn = get_db()

    cursor = conn.cursor()

    cursor.execute("""
        SELECT service,
               COUNT(*) cnt
        FROM ai_usage_log
        GROUP BY service
    """)

    service = cursor.fetchall()

    cursor.execute("""
        SELECT service,
            COUNT(*) cnt
        FROM ai_usage_log
        WHERE service != '방문 세션'
        GROUP BY service
    """)

    service = cursor.fetchall()
    
    cursor.execute("""
        SELECT COUNT(*) users
        FROM ai_usage_log
        WHERE service = '방문 세션'
    """)

    users = cursor.fetchone()["users"]

    cursor.execute("""
        SELECT COUNT(*) total
        FROM ai_usage_log
        WHERE service != '방문 세션'
    """)

    total = cursor.fetchone()["total"]
    
    cursor.execute("""
    SELECT COUNT(*) today
    FROM ai_usage_log
    WHERE DATE(created_at)=CURDATE()
        AND service != '방문 세션'
    """)

    today = cursor.fetchone()["today"]

    conn.close()

    return jsonify({
        "users": users,
        "total": total,
        "services": service,
        "today": today
    })
    
# ==========================================
# 🤖 AI 챗봇 통신 API (Ollama 연동)
# ==========================================
@app.route("/send_message", methods=["POST"])
def send_message():
    create_session()
    user_input = request.json.get("message", "").strip()
    update_session(service="채팅 서비스")

    if not user_input:
        return qa_response(
            question="",
            answer="질문을 입력해주세요.",
            response_source="CHAT_ENGINE",
            response_success=False
        )
    
    if not user_input:
        return jsonify({"response": "질문을 입력해주세요."})
    
    intent = classify_intent(user_input)

    intent_code = intent["intent_code"]
    intent_category = intent["intent_category"]
    
    save_usage("채팅 서비스",user_input)
    
    # 대시보드 관련 키워드 감지
    for keyword, item in dashboard_keywords.items():
        if keyword in user_input:
            return jsonify({
                "response": f"""
                {item['text']}
                <a href="{item['url']}" class="dashboard-btn">
                    🔎 {item['title']}
                </a>
                """
            })
    
    for word in FORBIDDEN_WORDS:
        if word in user_input:
            return jsonify({"response": "⚠️ 적절하지 않은 단어가 포함되어 있습니다. 바르고 고운 말을 사용해주세요."})
    
    # 버스 관련 질문이면 버스 API 호출
    bus_keywords = [
        "버스",
        "정류장",
        "도착",
        "언제 와",
        "언제와",
        "출발"
    ]

    bus_no = extract_bus_number(user_input)

    if bus_no:
        # 버스 위치 조회
        if is_bus_location_question(user_input):
            lines = search_bus_line(bus_no)

            if not lines:
                return qa_response(
                    question=user_input,
                    answer=f"{bus_no} 버스 정보를 찾을 수 없습니다.",
                    intent_code=intent_code,
                    intent_category=intent_category,
                    response_source="광주버스API",
                    response_success=False
                )

            line = lines[0]

            locations = get_bus_location(
                line["LINE_ID"]
            )

            if not locations:

                return qa_response(
                    question=user_input,
                    answer=f"🚌 {bus_no} 버스는 현재 운행 위치 정보를 확인할 수 없습니다.",
                    intent_code=intent_code,
                    intent_category=intent_category,
                    response_source="광주버스API",
                    response_success=False
                )

            msg = f"🚌 {bus_no} 현재 운행 위치입니다.<br><br>"

            for bus in locations:
                station_name = get_station_name_by_id(
                    bus["CURR_STOP_ID"]
                )

                msg += (
                    f"🚍 차량번호 : {bus['CARNO']}<br>"
                    f"📍 현재 위치 : {station_name}<br><br>"
                )

            return qa_response(
                question=user_input,
                answer=msg,
                intent_code=intent_code,
                intent_category=intent_category,
                response_source="광주버스API",
                response_success=True,
                tts_text=f"차량번호 {bus['CARNO']}은 현재 {station_name} 정류장에 위치해 있습니다."
            )

        # 버스 노선 조회
        if is_bus_route_question(user_input):

            lines = search_bus_line(bus_no)

            if lines:

                line = lines[0]

                return qa_response(
                    question=user_input,
                    answer=f"""🚌 <strong>{line['LINE_NAME']} 버스</strong><br>
                    기점 : {line['DIR_UP_NAME']}<br>
                    종점 : {line['DIR_DOWN_NAME']}<br>
                    첫차 : {line['FIRST_RUN_TIME']}<br>
                    막차 : {line['LAST_RUN_TIME']}<br>
                    배차간격 : 약 {line['RUN_INTERVAL']}분""",

                    intent_code=intent_code,
                    intent_category=intent_category,

                    response_source="광주버스API",
                    response_success=True,

                    tts_text=f"{line['LINE_NAME']} 버스의 기점은 {line['DIR_UP_NAME']}이며, "
                            f"종점은 {line['DIR_DOWN_NAME']}입니다. "
                            f"첫차 시간은 {line['FIRST_RUN_TIME']}이고, "
                            f"막차 시간은 {line['LAST_RUN_TIME']}입니다. "
                            f"배차 간격은 약 {line['RUN_INTERVAL']}분입니다."
                )
            
    # 이전 버스 질문 후 정류장 입력 처리
    if session.get("waiting_bus_station"):

        station_name = extract_station_name(user_input)

        # 빈 입력이면 계속 기다림
        if not station_name:
            return qa_response(
                question=user_input,
                answer="""🚌 실시간 버스 도착 정보를 확인하려면 정류장 이름을 알려주세요.<br><br>
                예)<br>
                • 경신여고<br>
                • 광주역<br>
                • 상무지구""",
                intent_code=intent_code,
                intent_category=intent_category,
                response_source="광주버스API",
                response_success=False
            )

        stations = search_bus_station(station_name)

        # ✅ 정류장을 찾은 경우
        if stations:
            
            unique_names = set(s["BUSSTOP_NAME"] for s in stations)

            if len(unique_names) == 1:
                station = stations[0]

            elif len(stations) > 1:

                names = []

                seen = set()

                for s in stations[:10]:
                    name = s["BUSSTOP_NAME"]

                    if name not in seen:
                        names.append(f"• {name}")
                        seen.add(name)

                return qa_response(
                    question=user_input,
                    answer="정류장이 여러 개 있습니다.<br><br>"
                           + "<br>".join(names)
                           + "<br><bt>원하는 정류장 이름을 다시 입력해주세요.",
                    intent_code=intent_code,
                    intent_category=intent_category,
                    response_source="광주버스API",
                    response_success=False
                )

            else:
                station = stations[0]

            # 도착정보 조회 성공 -> 대기 종료
            session.pop("waiting_bus_station", None)

            arrivals = get_bus_arrival(station["BUSSTOP_ID"])

            msg = f"{station['BUSSTOP_NAME']} 정류장 도착정보입니다.<br>"

            tts_text = f"{station['BUSSTOP_NAME']} 정류장의 버스 도착 정보입니다. "

            if not arrivals:
                msg += "현재 도착 예정 버스 정보가 없습니다."
                tts_text += "현재 도착 예정 버스 정보가 없습니다."

            else:

                for bus in arrivals[:10]:
                    msg += (
                        f"🚌 {bus['LINE_NAME']}번 "
                        f"({bus['DIR_START']} → {bus['DIR_END']})<br>"
                        f"⏱ {bus['REMAIN_MIN']}분 후 도착 "
                        f"({bus['REMAIN_STOP']}정류장 남음)<br><br>"
                    )

                # 음성은 너무 길지 않게 3개까지만 읽기
                for bus in arrivals[:3]:
                    tts_text += (
                        f"{bus['LINE_NAME']}번 버스는 "
                        f"{bus['REMAIN_MIN']}분 후 도착 예정이며 "
                        f"{bus['REMAIN_STOP']}정류장 남았습니다. "
                    )
                if len(arrivals) > 3:
                    tts_text += (
                        f"그 외 버스 정보는 화면에서 확인하실 수 있습니다."
                    )

            return qa_response(
                question=user_input,
                answer=msg,
                intent_code=intent_code,
                intent_category=intent_category,
                response_source="광주버스API",
                response_success=True,
                tts_text=tts_text
            )

    session.pop("waiting_bus_station", None)
    
    if any(word in user_input for word in bus_keywords):
        station_name=extract_station_name(user_input)

        if not station_name:
            session["waiting_bus_station"] = True
            return qa_response(
                question=user_input,
                answer="""🚌 실시간 버스 도착 정보를 확인하려면 정류장 이름을 알려주세요.<br><br>
                예)<br>
                • 경신여고<br>
                • 광주역<br>
                • 상무지구""",
                intent_code=intent_code,
                intent_category=intent_category,
                response_source="광주버스API",
                response_success=False
            )

        stations = search_bus_station(station_name)

        if not stations:
            session["waiting_bus_station"] = True
            return qa_response(
                question=user_input,
                answer=f"🚌 '{station_name}' 정류장을 찾을 수 없습니다.\n정류장 이름을 정확하게 다시 입력해주세요.",
                intent_code=intent_code,
                intent_category=intent_category,
                response_source="광주버스API",
                response_success=False
            )

        unique_names = set(s["BUSSTOP_NAME"] for s in stations)
        
        if len(unique_names) == 1:
            station = stations[0]

        elif len(stations) > 1:
            session["waiting_bus_station"] = True
            names = []
            seen = set()

            for s in stations[:10]:
                name = s["BUSSTOP_NAME"]
                if name not in seen:
                    names.append(f"• {name}")
                    seen.add(name)
            return qa_response(
                question=user_input,
                answer="정류장이 여러 개 있습니다.<br><br>"
                       + "<br>".join(names)
                       + "<br>원하는 정류장 이름을 다시 입력해주세요.",
                intent_code=intent_code,
                intent_category=intent_category,
                response_source="광주버스API",
                response_success=False
            )

        else:
            station = stations[0]

        arrivals=get_bus_arrival(station["BUSSTOP_ID"])

        msg=f"{station_name} 정류장 도착정보입니다.<br>"

        for bus in arrivals[:10]:
            msg += (
                f"🚌 {bus['LINE_NAME']}번 "
                f"({bus['DIR_START']} → {bus['DIR_END']})<br>"
                f"⏱ {bus['REMAIN_MIN']}분 후 도착 "
                f"({bus['REMAIN_STOP']}정류장 남음)<br><br>"
            )

        tts_text = f"{station_name} 정류장의 버스 도착 정보입니다. "

        if not arrivals:
            tts_text += "현재 도착 예정 버스 정보가 없습니다."

        else:
            for bus in arrivals[:3]:
                tts_text += (
                    f"{bus['LINE_NAME']}번 버스는 "
                    f"{bus['REMAIN_MIN']}분 후 도착 예정이며 "
                    f"{bus['REMAIN_STOP']}정류장 남았습니다. "
                )
            if len(arrivals) > 3:
                tts_text += (
                    f"그 외 버스 정보는 화면에서 확인하실 수 있습니다."
                )

        return qa_response(
            question=user_input,
            answer=msg,
            intent_code=intent_code,
            intent_category="교통",
            response_source="광주버스API",
            response_success=True,
            tts_text=tts_text
        )

    # 날씨 관련 질문이면 날씨 API 호출
    if "날씨" in user_input or "날씨 어때" in user_input or "날씨 알려줘" in user_input:
        return get_weather(user_input, intent_code, intent_category)
    
    # 날짜 관련 질문 감지
    if is_date_question(user_input):
        today = datetime.datetime.now()
        date_str = today.strftime("%Y년 %m월 %d일")  # YYYY년 MM월 DD일 형식
        day_of_week = get_korean_weekday(today.weekday())  # 요일 가져오기
        return qa_response(
            question=user_input,
            answer=f"오늘은 {date_str} {day_of_week} 입니다.",
            intent_code=intent_code,
            intent_category=intent_category,
            response_source="SYSTEM",
            response_success=True,
            tts_text=f"오늘은 {date_str} {day_of_week}입니다."
        )
    
    if is_time_question(user_input):
        now = datetime.datetime.now()
        hour = now.hour
        minute = now.minute
        second = now.second

        # 오전/오후 구분
        if hour < 12:
            am_pm = "오전"
            display_hour = hour
            
        else:
            am_pm = "오후"
            display_hour = hour - 12

        # 0시 처리
        if display_hour == 0:
            display_hour = 12

        time_str = f"{am_pm} {display_hour}시 {minute}분 {second}초"

        return qa_response(
            question=user_input,
            answer=f"현재 시간은 {time_str}입니다.",
            intent_code=intent_code,
            intent_category=intent_category,
            response_source="SYSTEM",
            response_success=True,
            tts_text=f"현재 시간은 {am_pm} {display_hour}시 {minute}분입니다."
        )

    
    payload = {
        "model": MODEL_NAME,
        "prompt": user_input,
        "num_predict": 128,
        "temperature": 0.1,
        "stream": False,
        "keep_alive": "24h"
    }

    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=60)
        if response.status_code == 200:
            raw_reply = response.json().get("response", "")
            return qa_response(
                question=user_input,
                answer=raw_reply,
                intent_code=intent_code,
                intent_category=intent_category,
                response_source="OLLAMA",
                response_success=True
            )
        else:
            return jsonify({"response": "⚠️ AI 서버에 일시적인 문제가 발생했습니다."}), 500
    except Exception as e:
        print(f"Ollama Connection Error: {e}")
        return jsonify({"response": "⚠️ AI 서버와 연결할 수 없습니다. 관리자에게 문의해주세요."}), 500

# ==========================================
# 🔊 Google Cloud TTS 변환 API
# ==========================================
@app.route("/get_tts", methods=["POST"])
def get_tts():
    text = request.json.get("text", "").strip()
    if not text:
        return jsonify({"error": "텍스트가 비어있습니다."}), 400

    try:
        # 1. 음성 생성 요청
        speak_res = requests.post(
        "https://api.typecast.ai/v1/text-to-speech",
        headers=TYPECAST_HEADERS,

        json={
            "voice_id": VOICE_ID,
            "text": text,
            "model": "ssfm-v30",
            "language": "kor",
            "output": {
                "audio_format": "mp3"
            }
        }
)
        speak_res.raise_for_status()

        audio_data = BytesIO(speak_res.content)

        return send_file(
            audio_data,
            mimetype="audio/mpeg",
            download_name="tts.mp3"
        )

    except Exception as e:
        print("TTS 생성 중 오류 발생:", e)
        return jsonify({"error": "TTS 처리 중 오류 발생", "detail": str(e)}), 500
    
JEONIL_NOTICE_URL = ("https://www.gwangju.go.kr/"
    "jeonil/boardList.do"
    "?pageId=jeonil19"
    "&boardId=BD_0000006002"
)
GWANGJU_EVENT_URL = "https://tour.gwangju.go.kr/home/tour/culture/festival.cs"
GIE_URL = "https://lms.gie.kr/"

def crawl_jeonil_events():
    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/131.0.0.0 Safari/537.36"
            )
        }

        response = requests.get(
            JEONIL_NOTICE_URL,
            headers=headers,
            timeout=10
        )

        response.raise_for_status()

        # 광주시청 페이지 인코딩 문제 방지
        response.encoding = response.apparent_encoding

        soup = BeautifulSoup(
            response.text,
            "html.parser"
        )

        events = []

        # 전일빌딩245 게시판 목록
        rows = soup.select(
            ".board_list_body .body_row"
        )

        for row in rows:

            # 제목 영역
            link = row.select_one(
                ".subject a"
            )

            if not link:
                continue

            title = link.get_text(
                " ",
                strip=True
            )

            # 상세 페이지 URL
            href = link.get("href")

            if not href:
                continue

            url = urljoin(
                JEONIL_NOTICE_URL,
                href
            )

            # 작성일
            date_element = row.select_one(
                ".date"
            )

            date = ""

            if date_element:
                date = date_element.get_text(
                    " ",
                    strip=True
                )

            events.append({
                "title": title,
                "date": date,
                "url": url,
                "imgContent": "🏢"
            })

        print(
            f"[전일빌딩245] "
            f"{len(events)}개 게시글 수집 완료"
        )

        return events

    except Exception as e:
        print(
            f"[전일빌딩245 크롤링 오류] {e}"
        )
        return []


def crawl_gwangju_events():
    headers = {
        "User-Agent": "Mozilla/5.0"
    }

    events = []

    page = 1

    while True:
        params = {
            "m": "315",
            "pageIndex": page
        }

        print(f"{page}페이지 수집중...")

        res = requests.get(
            GWANGJU_EVENT_URL,
            params=params,
            headers=headers,
            timeout=10

        )

        soup = BeautifulSoup(res.text, "html.parser")

        items = soup.select(".festivalList .item")

        # 더 이상 행사가 없으면 종료
        if not items:

            break

        for item in items:
            title = item.select_one("dt").get_text(strip=True)
            img = item.select_one("img")
            image = ""

            if img:
                image = urljoin(GWANGJU_EVENT_URL, img.get("src", ""))

            detail = item.select_one(".btnView")

            detail_url = ""

            if detail:
                detail_url = urljoin(GWANGJU_EVENT_URL, detail.get("href", ""))

            info = {}

            for li in item.select("li"):
                tit = li.select_one(".tit")
                txt = li.select_one(".txt")
                
                if tit and txt:
                    info[tit.get_text(strip=True)] = txt.get_text(" ", strip=True)

            events.append({
                "title": title,
                "period": info.get("기간", ""),
                "time": info.get("시간", ""),
                "location": info.get("장소", ""),
                "contact": info.get("연락처", ""),
                "fee": info.get("요금정보", ""),
                "image": image,
                "url": detail_url
            })

        page += 1

    return events

if __name__ == '__main__':
    warmup()
    app.run(host='0.0.0.0', port=5000, debug=True)
