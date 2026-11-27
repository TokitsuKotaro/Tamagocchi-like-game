"""API Gateway REST API ?????

Routes:
  GET  /pet?userId={id}  現在の状態を取得（遅延評価を実行して保存）
  POST /pet/action       {"userId": "...", "action": "feed_sea" | ...}
  POST /pet/reset        {"userId": "..."}
"""

from __future__ import annotations

import json
import os
import time
from decimal import Decimal
from typing import Any, Dict, Optional, Tuple

import boto3
from botocore.exceptions import ClientError

from evolution import (
    VALID_ACTIONS,
    apply_action,
    apply_time_elapsed,
    create_new_pet_data,
    reset_pet,
)

TABLE_NAME = os.environ.get("TABLE_NAME", "HenshinTamagoTable")

_dynamodb = boto3.resource("dynamodb")
_table = _dynamodb.Table(TABLE_NAME)

CORS_HEADERS = {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def _now() -> int:
    return int(time.time())


def _to_dynamo(value: Any) -> Any:
    """JSON互換の値をDynamoDB用に変換（int -> Decimal）。"""
    if isinstance(value, bool):
        return value
    if isinstance(value, int):
        return Decimal(value)
    if isinstance(value, float):
        return Decimal(str(value))
    if isinstance(value, dict):
        return {k: _to_dynamo(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_to_dynamo(v) for v in value]
    return value


def _from_dynamo(value: Any) -> Any:
    """DynamoDBの値をJSON互換に変換（Decimal -> int）。"""
    if isinstance(value, Decimal):
        return int(value)
    if isinstance(value, dict):
        return {k: _from_dynamo(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_from_dynamo(v) for v in value]
    return value


def _response(status: int, body: Any) -> Dict[str, Any]:
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, ensure_ascii=False),
    }


def _error(status: int, message: str) -> Dict[str, Any]:
    return _response(status, {"error": message})


def _load_pet(user_id: str) -> Dict[str, Any]:
    result = _table.get_item(Key={"userId": user_id})
    item = result.get("Item")
    if item is None:
        return create_new_pet_data(user_id, _now())
    return _from_dynamo(item)


def _save_pet(data: Dict[str, Any]) -> None:
    _table.put_item(Item=_to_dynamo(data))


def _parse_body(event: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    raw = event.get("body")
    if not raw:
        return None, _error(400, "リクエストボディが空です")
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return None, _error(400, "JSONの解析に失敗しました")
    if not isinstance(parsed, dict):
        return None, _error(400, "JSONオブジェクトを指定してください")
    return parsed, None


def _user_id_from_query(event: Dict[str, Any]) -> Optional[str]:
    params = event.get("queryStringParameters") or {}
    user_id = params.get("userId")
    return user_id.strip() if isinstance(user_id, str) and user_id.strip() else None


def _handle_get_pet(event: Dict[str, Any]) -> Dict[str, Any]:
    user_id = _user_id_from_query(event)
    if not user_id:
        return _error(400, "userId を指定してください")
    data = _load_pet(user_id)
    evaluated = apply_time_elapsed(data, _now())
    _save_pet(evaluated)
    return _response(200, evaluated)


def _handle_action(event: Dict[str, Any]) -> Dict[str, Any]:
    body, err = _parse_body(event)
    if err:
        return err
    assert body is not None
    user_id = body.get("userId")
    action = body.get("action")
    if not isinstance(user_id, str) or not user_id.strip():
        return _error(400, "userId を指定してください")
    if action not in VALID_ACTIONS:
        return _error(400, f"action は {', '.join(VALID_ACTIONS)} のいずれかを指定してください")
    data = _load_pet(user_id.strip())
    result = apply_action(data, action, _now())
    _save_pet(result["data"])
    return _response(200, result)


def _handle_reset(event: Dict[str, Any]) -> Dict[str, Any]:
    body, err = _parse_body(event)
    if err:
        return err
    assert body is not None
    user_id = body.get("userId")
    if not isinstance(user_id, str) or not user_id.strip():
        return _error(400, "userId を指定してください")
    data = _load_pet(user_id.strip())
    next_data = reset_pet(data, _now())
    _save_pet(next_data)
    return _response(200, next_data)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = (
        event.get("requestContext", {}).get("http", {}).get("method")
        or event.get("httpMethod")
        or ""
    ).upper()
    path = (
        event.get("rawPath")
        or event.get("path")
        or event.get("requestContext", {}).get("http", {}).get("path")
        or "/"
    )

    if method == "OPTIONS":
        return {"statusCode": 204, "headers": CORS_HEADERS, "body": ""}

    try:
        if method == "GET" and path.rstrip("/").endswith("/pet"):
            return _handle_get_pet(event)
        if method == "POST" and path.rstrip("/").endswith("/pet/action"):
            return _handle_action(event)
        if method == "POST" and path.rstrip("/").endswith("/pet/reset"):
            return _handle_reset(event)
        return _error(404, "Not Found")
    except ClientError as exc:
        print(f"DynamoDB error: {exc}")
        return _error(500, "データベースエラーが発生しました")
    except Exception as exc:  # noqa: BLE001
        print(f"Unexpected error: {exc}")
        return _error(500, "サーバーエラーが発生しました")
