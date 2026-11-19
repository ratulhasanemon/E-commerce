# products/telegram.py
import requests

TELEGRAM_BOT_TOKEN = "8499482363:AAGq-aQ91MfXMfynspztfHAYVDmWlDbSfnA"
TELEGRAM_CHAT_ID = "6910082992"

def send_telegram_message(text):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    requests.post(url, json={
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "HTML"
    })
