import csv
import io
import random
from datetime import datetime
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import text

from app.core.db import (
    engine,
    test_database_connection,
    save_realtime_value,
    save_historical_value,
    save_alarm,
    save_system_event,
    get_all_settings,
    get_setting,
    update_setting,
    get_all_users,
    authenticate_user,
    save_audit_log,
    get_audit_logs,
    get_all_recipes,
    get_recipe_by_id,
    get_recipe_steps,
    create_recipe,
    update_recipe,
    delete_recipe,
    add_recipe_step,
    update_recipe_step,
    delete_recipe_step,
    get_all_batch_runs,
    get_batch_by_id,
    get_running_batch,
    create_batch_run,
    update_batch_status,
    add_batch_note,
    get_batch_notes,
    get_history_values_between,
    get_alarms_between,
    add_pedagogical_annotation,
    get_pedagogical_annotations,
    add_replay_marker,
    get_replay_markers,
    save_process_health_snapshot,
    get_process_health_snapshots,
)
from app.services.source_mode import get_source_mode, set_source_mode

app = FastAPI(title="BioFlo Supervision API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RecipeCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    objective: Optional[str] = ""
    created_by: Optional[str] = "system"


class RecipeUpdate(BaseModel):
    name: str
    description: Optional[str] = ""
    objective: Optional[str] = ""
    is_active: bool = True
    actor: Optional[str] = "system"


class RecipeStepCreate(BaseModel):
    recipe_id: int
    step_order: int
    step_name: str
    duration_min: int = 0
    temp_setpoint: Optional[str] = ""
    ph_setpoint: Optional[str] = ""
    do_setpoint: Optional[str] = ""
    rpm_setpoint: Optional[str] = ""
    notes: Optional[str] = ""
    actor: Optional[str] = "system"


class RecipeStepUpdate(BaseModel):
    step_order: int
    step_name: str
    duration_min: int = 0
    temp_setpoint: Optional[str] = ""
    ph_setpoint: Optional[str] = ""
    do_setpoint: Optional[str] = ""
    rpm_setpoint: Optional[str] = ""
    notes: Optional[str] = ""
    actor: Optional[str] = "system"


class BatchCreate(BaseModel):
    name: str
    recipe_id: int
    operator_username: str
    target_duration_min: int = 0
    objective: Optional[str] = ""
    notes: Optional[str] = ""


class BatchNoteCreate(BaseModel):
    batch_id: int
    note_type: Optional[str] = "operator_note"
    note_text: str
    author: Optional[str] = "system"


class AnnotationCreate(BaseModel):
    batch_id: int
    annotation_type: Optional[str] = "event"
    title: str
    description: Optional[str] = ""
    event_time: Optional[str] = None
    tag_name: Optional[str] = ""
    tag_value: Optional[str] = ""
    author: Optional[str] = "system"


class ReplayMarkerCreate(BaseModel):
    batch_id: int
    replay_time: str
    marker_type: Optional[str] = "phase"
    label: str
    description: Optional[str] = ""


sim_data = {
    "source_mode": "simulation",
    "comm_status": "ok",
    "data_quality": "good",
    "process_state": "running",
    "temp_reactor": 37.0,
    "ph_value": 6.95,
    "do_percent": 58.0,
    "stirrer_rpm": 300,
    "pump1_state": True,
    "pump2_state": False,
    "pump3_state": False,
    "gas1_state": True,
    "gas2_state": False,
    "gas3_state": False,
    "gas4_state": True,
}

active_alarm_codes = set()
acknowledged_alarm_codes = set()


def persist_sim_data():
    tags_to_store = [
        "source_mode",
        "comm_status",
        "data_quality",
        "process_state",
        "temp_reactor",
        "ph_value",
        "do_percent",
        "stirrer_rpm",
        "pump1_state",
        "pump2_state",
        "pump3_state",
        "gas1_state",
        "gas2_state",
        "gas3_state",
        "gas4_state",
    ]

    for tag in tags_to_store:
        value = sim_data[tag]
        save_realtime_value(tag, value)
        save_historical_value(tag, value)


def update_simulation():
    sim_data["source_mode"] = "simulation"
    sim_data["comm_status"] = "ok"
    sim_data["data_quality"] = "good"
    sim_data["process_state"] = "running"

    sim_data["temp_reactor"] = round(
        sim_data["temp_reactor"] + random.uniform(-0.2, 0.2), 2
    )
    sim_data["ph_value"] = round(
        sim_data["ph_value"] + random.uniform(-0.03, 0.03), 2
    )
    sim_data["do_percent"] = round(
        sim_data["do_percent"] + random.uniform(-1.5, 1.5), 1
    )
    sim_data["stirrer_rpm"] = max(
        250, min(400, sim_data["stirrer_rpm"] + random.randint(-5, 5))
    )

    sim_data["temp_reactor"] = max(35.0, min(39.5, sim_data["temp_reactor"]))
    sim_data["ph_value"] = max(6.5, min(7.5, sim_data["ph_value"]))
    sim_data["do_percent"] = max(20.0, min(90.0, sim_data["do_percent"]))

    sim_data["pump1_state"] = sim_data["do_percent"] < 50
    sim_data["pump2_state"] = sim_data["ph_value"] < 6.8
    sim_data["pump3_state"] = sim_data["temp_reactor"] > 38.0

    sim_data["gas1_state"] = sim_data["do_percent"] < 60
    sim_data["gas2_state"] = sim_data["do_percent"] < 45
    sim_data["gas3_state"] = False
    sim_data["gas4_state"] = sim_data["temp_reactor"] > 37.8


def build_live_placeholder():
    return {
        "source_mode": "live_bioflo",
        "comm_status": "waiting_connector",
        "data_quality": "no_live_data",
        "process_state": "standby",
        "temp_reactor": "--",
        "ph_value": "--",
        "do_percent": "--",
        "stirrer_rpm": "--",
        "pump1_state": False,
        "pump2_state": False,
        "pump3_state": False,
        "gas1_state": False,
        "gas2_state": False,
        "gas3_state": False,
        "gas4_state": False,
    }


def build_active_alarms():
    active_alarms = []

    do_low_threshold = float(get_setting("do_low_threshold", 35))
    temp_high_threshold = float(get_setting("temp_high_threshold", 38.5))
    ph_low_threshold = float(get_setting("ph_low_threshold", 6.7))

    if sim_data["do_percent"] < do_low_threshold:
        active_alarms.append(
            {
                "code": "do_low",
                "message": f"DO below low threshold ({do_low_threshold})",
                "priority": "warning",
                "status": "active",
            }
        )

    if sim_data["temp_reactor"] > temp_high_threshold:
        active_alarms.append(
            {
                "code": "temp_high",
                "message": f"Temperature above high threshold ({temp_high_threshold})",
                "priority": "critical",
                "status": "active",
            }
        )

    if sim_data["ph_value"] < ph_low_threshold:
        active_alarms.append(
            {
                "code": "ph_low",
                "message": f"pH below low threshold ({ph_low_threshold})",
                "priority": "warning",
                "status": "active",
            }
        )

    for alarm in active_alarms:
        if alarm["code"] in acknowledged_alarm_codes:
            alarm["status"] = "acknowledged"

    return active_alarms


def persist_alarm_changes(active_alarms):
    global active_alarm_codes, acknowledged_alarm_codes

    current_alarm_codes = {alarm["code"] for alarm in active_alarms}

    new_alarm_codes = current_alarm_codes - active_alarm_codes
    cleared_alarm_codes = active_alarm_codes - current_alarm_codes

    for alarm in active_alarms:
        if alarm["code"] in new_alarm_codes:
            save_alarm(
                code=alarm["code"],
                message=alarm["message"],
                priority=alarm["priority"],
                status="active",
            )
            save_system_event(
                event_type="alarm_active",
                message=f"{alarm['code']} became active",
            )

    for code in cleared_alarm_codes:
        save_alarm(
            code=code,
            message=f"{code} returned to normal",
            priority="info",
            status="cleared",
        )
        save_system_event(
            event_type="alarm_cleared",
            message=f"{code} cleared",
        )
        if code in acknowledged_alarm_codes:
            acknowledged_alarm_codes.remove(code)

    active_alarm_codes = current_alarm_codes


def safe_float(value):
    try:
        return float(value)
    except Exception:
        return None


def compute_basic_stats(values):
    numeric_values = [safe_float(v) for v in values]
    numeric_values = [v for v in numeric_values if v is not None]

    if not numeric_values:
        return {
            "count": 0,
            "min": None,
            "max": None,
            "avg": None,
            "delta": None,
        }

    return {
        "count": len(numeric_values),
        "min": round(min(numeric_values), 3),
        "max": round(max(numeric_values), 3),
        "avg": round(sum(numeric_values) / len(numeric_values), 3),
        "delta": round(numeric_values[-1] - numeric_values[0], 3),
    }


def compute_out_of_range_count(tag_name, values):
    numeric_values = [safe_float(v) for v in values]
    numeric_values = [v for v in numeric_values if v is not None]

    if not numeric_values:
        return {"count": 0, "percent": 0}

    do_low_threshold = float(get_setting("do_low_threshold", 35))
    temp_high_threshold = float(get_setting("temp_high_threshold", 38.5))
    ph_low_threshold = float(get_setting("ph_low_threshold", 6.7))

    out_count = 0

    for value in numeric_values:
        if tag_name == "temp_reactor" and value > temp_high_threshold:
            out_count += 1
        elif tag_name == "ph_value" and value < ph_low_threshold:
            out_count += 1
        elif tag_name == "do_percent" and value < do_low_threshold:
            out_count += 1

    percent = round((out_count / len(numeric_values)) * 100, 2) if numeric_values else 0
    return {"count": out_count, "percent": percent}


def compute_recipe_target_summary(recipe_steps):
    if not recipe_steps:
        return {}

    mapping = {
        "temp_reactor": "temp_setpoint",
        "ph_value": "ph_setpoint",
        "do_percent": "do_setpoint",
        "stirrer_rpm": "rpm_setpoint",
    }

    targets = {}

    for tag_name, step_field in mapping.items():
        weighted_sum = 0.0
        total_duration = 0

        for step in recipe_steps:
            duration = step.get("duration_min") or 0
            value = safe_float(step.get(step_field))

            if value is not None and duration > 0:
                weighted_sum += value * duration
                total_duration += duration

        if total_duration > 0:
            targets[tag_name] = round(weighted_sum / total_duration, 3)
        else:
            targets[tag_name] = None

    return targets


def build_batch_analysis(batch_id):
    batch = get_batch_by_id(batch_id)
    if not batch:
        return {"status": "error", "details": "Batch not found"}

    if not batch.get("start_time"):
        return {
            "status": "error",
            "details": "Batch has not started yet",
        }

    start_time = batch["start_time"]
    end_time = batch["end_time"] or datetime.now()

    tag_names = ["temp_reactor", "ph_value", "do_percent", "stirrer_rpm"]
    tag_analysis = {}

    for tag_name in tag_names:
        rows = get_history_values_between(tag_name, start_time, end_time)
        values = [row["tag_value"] for row in rows]
        stats = compute_basic_stats(values)
        out_range = compute_out_of_range_count(tag_name, values)

        tag_analysis[tag_name] = {
            "stats": stats,
            "out_of_range": out_range,
        }

    alarms = get_alarms_between(start_time, end_time)
    alarms_by_code = {}
    for alarm in alarms:
        code = alarm["code"]
        alarms_by_code[code] = alarms_by_code.get(code, 0) + 1

    recipe_steps = get_recipe_steps(batch["recipe_id"]) if batch.get("recipe_id") else []
    recipe_targets = compute_recipe_target_summary(recipe_steps)

    recipe_comparison = {}
    for tag_name in tag_names:
        actual_avg = tag_analysis[tag_name]["stats"]["avg"]
        target_avg = recipe_targets.get(tag_name)

        if actual_avg is not None and target_avg is not None:
            recipe_comparison[tag_name] = {
                "target_avg": target_avg,
                "actual_avg": actual_avg,
                "deviation": round(actual_avg - target_avg, 3),
            }
        else:
            recipe_comparison[tag_name] = {
                "target_avg": target_avg,
                "actual_avg": actual_avg,
                "deviation": None,
            }

    actual_duration_min = round((end_time - start_time).total_seconds() / 60, 2)

    observations = []

    if len(alarms) == 0:
        observations.append("No alarms were recorded during the batch.")
    else:
        observations.append(f"{len(alarms)} alarm events were recorded during the batch.")

    temp_dev = recipe_comparison["temp_reactor"]["deviation"]
    if temp_dev is not None:
        if abs(temp_dev) <= 0.3:
            observations.append("Temperature remained close to the recipe target.")
        else:
            observations.append("Temperature deviated from the recipe target.")

    do_out = tag_analysis["do_percent"]["out_of_range"]["percent"]
    if do_out > 20:
        observations.append("DO regulation was unstable for a significant portion of the batch.")
    elif do_out > 0:
        observations.append("DO occasionally went below the configured threshold.")
    else:
        observations.append("DO remained within the expected range.")

    ph_out = tag_analysis["ph_value"]["out_of_range"]["percent"]
    if ph_out > 0:
        observations.append("pH was below target threshold during part of the run.")
    else:
        observations.append("pH remained within the acceptable operating window.")

    return {
        "status": "success",
        "batch": batch,
        "time_window": {
            "start_time": start_time,
            "end_time": end_time,
            "actual_duration_min": actual_duration_min,
        },
        "tags": tag_analysis,
        "alarm_summary": {
            "total_alarm_events": len(alarms),
            "alarms_by_code": alarms_by_code,
        },
        "recipe_comparison": recipe_comparison,
        "observations": observations,
    }


def build_batch_comparison(batch_a_id, batch_b_id):
    analysis_a = build_batch_analysis(batch_a_id)
    analysis_b = build_batch_analysis(batch_b_id)

    if analysis_a.get("status") != "success":
        return analysis_a

    if analysis_b.get("status") != "success":
        return analysis_b

    tags = ["temp_reactor", "ph_value", "do_percent", "stirrer_rpm"]

    comparison = {}
    for tag in tags:
        a_avg = analysis_a["tags"][tag]["stats"]["avg"]
        b_avg = analysis_b["tags"][tag]["stats"]["avg"]
        a_out = analysis_a["tags"][tag]["out_of_range"]["percent"]
        b_out = analysis_b["tags"][tag]["out_of_range"]["percent"]
        a_dev = analysis_a["recipe_comparison"][tag]["deviation"]
        b_dev = analysis_b["recipe_comparison"][tag]["deviation"]

        comparison[tag] = {
            "batch_a_avg": a_avg,
            "batch_b_avg": b_avg,
            "avg_difference": round((a_avg - b_avg), 3) if a_avg is not None and b_avg is not None else None,
            "batch_a_out_percent": a_out,
            "batch_b_out_percent": b_out,
            "out_percent_difference": round((a_out - b_out), 3) if a_out is not None and b_out is not None else None,
            "batch_a_recipe_deviation": a_dev,
            "batch_b_recipe_deviation": b_dev,
        }

    duration_a = analysis_a["time_window"]["actual_duration_min"]
    duration_b = analysis_b["time_window"]["actual_duration_min"]

    alarms_a = analysis_a["alarm_summary"]["total_alarm_events"]
    alarms_b = analysis_b["alarm_summary"]["total_alarm_events"]

    summary = []

    if alarms_a < alarms_b:
        summary.append(f"{analysis_a['batch']['name']} had fewer alarm events than {analysis_b['batch']['name']}.")
    elif alarms_b < alarms_a:
        summary.append(f"{analysis_b['batch']['name']} had fewer alarm events than {analysis_a['batch']['name']}.")
    else:
        summary.append("Both batches had the same number of alarm events.")

    if duration_a < duration_b:
        summary.append(f"{analysis_a['batch']['name']} finished in a shorter duration.")
    elif duration_b < duration_a:
        summary.append(f"{analysis_b['batch']['name']} finished in a shorter duration.")
    else:
        summary.append("Both batches had the same duration.")

    return {
        "status": "success",
        "batch_a": analysis_a,
        "batch_b": analysis_b,
        "comparison": comparison,
        "summary": summary,
    }


def compute_health_from_analysis(analysis):
    if analysis.get("status") != "success":
        return {"status": "error", "details": "Analysis unavailable"}

    alarm_events = analysis["alarm_summary"]["total_alarm_events"]
    temp_out = analysis["tags"]["temp_reactor"]["out_of_range"]["percent"]
    ph_out = analysis["tags"]["ph_value"]["out_of_range"]["percent"]
    do_out = analysis["tags"]["do_percent"]["out_of_range"]["percent"]

    stability_base = 100 - ((temp_out + ph_out + do_out) / 3)
    stability_score = max(0, round(stability_base, 2))

    alarm_penalty = min(100, alarm_events * 8)
    alarm_score = max(0, round(100 - alarm_penalty, 2))

    deviations = []
    for tag in ["temp_reactor", "ph_value", "do_percent", "stirrer_rpm"]:
        dev = analysis["recipe_comparison"][tag]["deviation"]
        if dev is not None:
            deviations.append(abs(dev))

    if deviations:
        dev_avg = sum(deviations) / len(deviations)
        recipe_adherence_score = max(0, round(100 - (dev_avg * 20), 2))
    else:
        recipe_adherence_score = 75.0

    alarm_weight = float(get_setting("health_alarm_weight", 35))
    recipe_weight = float(get_setting("health_recipe_weight", 35))
    stability_weight = float(get_setting("health_stability_weight", 30))

    total_weight = alarm_weight + recipe_weight + stability_weight
    if total_weight == 0:
        total_weight = 100

    health_score = round(
        (
            alarm_score * alarm_weight
            + recipe_adherence_score * recipe_weight
            + stability_score * stability_weight
        ) / total_weight,
        2,
    )

    if health_score >= 85:
        summary = "Process health is strong and stable."
    elif health_score >= 65:
        summary = "Process health is acceptable with moderate deviations."
    else:
        summary = "Process health is weak and needs review."

    return {
        "status": "success",
        "health_score": health_score,
        "stability_score": stability_score,
        "alarm_score": alarm_score,
        "recipe_adherence_score": recipe_adherence_score,
        "summary": summary,
    }


def build_replay_data(batch_id):
    batch = get_batch_by_id(batch_id)
    if not batch:
        return {"status": "error", "details": "Batch not found"}

    if not batch.get("start_time"):
        return {"status": "error", "details": "Batch has not started yet"}

    start_time = batch["start_time"]
    end_time = batch["end_time"] or datetime.now()

    tags = {}
    for tag_name in ["temp_reactor", "ph_value", "do_percent", "stirrer_rpm"]:
        tags[tag_name] = get_history_values_between(tag_name, start_time, end_time)

    alarms = get_alarms_between(start_time, end_time)
    annotations = get_pedagogical_annotations(batch_id)
    replay_markers = get_replay_markers(batch_id)

    return {
        "status": "success",
        "batch": batch,
        "time_window": {
            "start_time": start_time,
            "end_time": end_time,
        },
        "tags": tags,
        "alarms": alarms,
        "annotations": annotations,
        "markers": replay_markers,
    }


@app.get("/")
def root():
    return {
        "message": "BioFlo Supervision backend is running",
        "status": "ok",
    }


@app.get("/status")
def get_status():
    return {
        "status": "ok",
        "mode": get_source_mode(),
        "message": "Backend online",
    }


@app.get("/source-mode")
def get_current_source_mode():
    return {"source_mode": get_source_mode()}


@app.get("/set-source-mode/{mode}")
def set_current_source_mode(mode: str, actor: str = "system"):
    try:
        new_mode = set_source_mode(mode)
        save_system_event(
            event_type="source_mode_changed",
            message=f"Source mode changed to {new_mode}",
        )
        save_audit_log(
            actor=actor,
            action="change_source_mode",
            target="source_mode",
            details=f"Changed source mode to {new_mode}",
        )
        return {"source_mode": new_mode, "status": "updated"}
    except ValueError as e:
        return {"status": "error", "details": str(e)}


@app.get("/settings")
def get_settings():
    return {"rows": get_all_settings()}


@app.get("/settings/update/{setting_key}/{setting_value}")
def set_setting_value(setting_key: str, setting_value: str, actor: str = "system"):
    try:
        update_setting(setting_key, setting_value)
        save_system_event(
            event_type="setting_updated",
            message=f"{setting_key} updated to {setting_value}",
        )
        save_audit_log(
            actor=actor,
            action="update_setting",
            target=setting_key,
            details=f"New value: {setting_value}",
        )
        return {
            "status": "updated",
            "setting_key": setting_key,
            "setting_value": setting_value,
        }
    except Exception as e:
        return {"status": "error", "details": str(e)}


@app.get("/users")
def get_users():
    return {"rows": get_all_users()}


@app.get("/login/{username}/{password}")
def login(username: str, password: str):
    user = authenticate_user(username, password)

    if not user:
        return {"status": "error", "details": "Invalid username or password"}

    save_system_event(
        event_type="user_login",
        message=f"{user['username']} logged in as {user['role']}",
    )

    save_audit_log(
        actor=user["username"],
        action="login",
        target="session",
        details=f"Logged in as {user['role']}",
    )

    return {
        "status": "success",
        "user": user,
    }


@app.get("/ack-alarm/{code}")
def acknowledge_alarm(code: str, actor: str = "system"):
    current_alarms = build_active_alarms()
    current_codes = {alarm["code"] for alarm in current_alarms}

    if code not in current_codes:
        return {
            "status": "error",
            "details": f"Alarm {code} is not currently active",
        }

    acknowledged_alarm_codes.add(code)

    save_alarm(
        code=code,
        message=f"{code} acknowledged by operator",
        priority="info",
        status="acknowledged",
    )
    save_system_event(
        event_type="alarm_acknowledged",
        message=f"{code} acknowledged",
    )
    save_audit_log(
        actor=actor,
        action="ack_alarm",
        target=code,
        details=f"Acknowledged alarm {code}",
    )

    return {"status": "acknowledged", "code": code}


@app.get("/ack-all-alarms")
def acknowledge_all_alarms(actor: str = "system"):
    current_alarms = build_active_alarms()

    for alarm in current_alarms:
        code = alarm["code"]
        if code not in acknowledged_alarm_codes:
            acknowledged_alarm_codes.add(code)
            save_alarm(
                code=code,
                message=f"{code} acknowledged by operator",
                priority="info",
                status="acknowledged",
            )
            save_system_event(
                event_type="alarm_acknowledged",
                message=f"{code} acknowledged",
            )
            save_audit_log(
                actor=actor,
                action="ack_alarm",
                target=code,
                details=f"Acknowledged alarm {code}",
            )

    return {"status": "acknowledged_all", "count": len(current_alarms)}


@app.get("/realtime")
def get_realtime():
    mode = get_source_mode()

    if mode == "simulation":
        update_simulation()
        persist_sim_data()
        return sim_data

    if mode == "live_bioflo":
        return build_live_placeholder()

    return {"error": "Unknown source mode"}


@app.get("/alarms")
def get_alarms():
    mode = get_source_mode()

    if mode == "simulation":
        active_alarms = build_active_alarms()
        persist_alarm_changes(active_alarms)

        global_status = "normal"
        if active_alarms:
            global_status = "warning"
        if any(alarm["priority"] == "critical" for alarm in active_alarms):
            global_status = "critical"

        acknowledged_count = sum(
            1 for alarm in active_alarms if alarm["status"] == "acknowledged"
        )

        return {
            "global_status": global_status,
            "active_count": len(active_alarms),
            "acknowledged_count": acknowledged_count,
            "active_alarms": active_alarms,
        }

    if mode == "live_bioflo":
        return {
            "global_status": "warning",
            "active_count": 1,
            "acknowledged_count": 0,
            "active_alarms": [
                {
                    "code": "live_source_not_connected",
                    "message": "Live BioFlo connector is not yet available",
                    "priority": "warning",
                    "status": "active",
                }
            ],
        }

    return {
        "global_status": "error",
        "active_count": 1,
        "acknowledged_count": 0,
        "active_alarms": [
            {
                "code": "unknown_mode",
                "message": "Unknown data source mode",
                "priority": "critical",
                "status": "active",
            }
        ],
    }


@app.get("/db-status")
def get_db_status():
    try:
        test_database_connection()
        return {"database": "connected"}
    except Exception as e:
        return {"database": "error", "details": str(e)}


@app.get("/db-realtime")
def get_db_realtime():
    query = text("""
        SELECT tag_name, tag_value, updated_at
        FROM realtime_values
        ORDER BY tag_name
    """)
    with engine.connect() as connection:
        rows = connection.execute(query).mappings().all()

    return {"rows": [dict(row) for row in rows]}


@app.get("/history/{tag_name}")
def get_history(tag_name: str):
    query = text("""
        SELECT tag_name, tag_value, recorded_at
        FROM historical_values
        WHERE tag_name = :tag_name
        ORDER BY recorded_at DESC
        LIMIT 50
    """)
    with engine.connect() as connection:
        rows = connection.execute(query, {"tag_name": tag_name}).mappings().all()

    rows = list(reversed([dict(row) for row in rows]))
    return {"tag": tag_name, "rows": rows}


@app.get("/db-alarms")
def get_db_alarms():
    query = text("""
        SELECT id, code, message, priority, status, created_at
        FROM alarms
        ORDER BY created_at DESC
        LIMIT 50
    """)
    with engine.connect() as connection:
        rows = connection.execute(query).mappings().all()

    return {"rows": [dict(row) for row in rows]}


@app.get("/db-events")
def get_db_events():
    query = text("""
        SELECT id, event_type, message, created_at
        FROM system_events
        ORDER BY created_at DESC
        LIMIT 50
    """)
    with engine.connect() as connection:
        rows = connection.execute(query).mappings().all()

    return {"rows": [dict(row) for row in rows]}


@app.get("/audit-logs")
def get_audit():
    return {"rows": get_audit_logs()}


@app.get("/export/history/{tag_name}")
def export_history_csv(tag_name: str):
    query = text("""
        SELECT tag_name, tag_value, recorded_at
        FROM historical_values
        WHERE tag_name = :tag_name
        ORDER BY recorded_at DESC
        LIMIT 500
    """)
    with engine.connect() as connection:
        rows = connection.execute(query, {"tag_name": tag_name}).mappings().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["tag_name", "tag_value", "recorded_at"])

    for row in rows:
        writer.writerow([row["tag_name"], row["tag_value"], row["recorded_at"]])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={tag_name}_history.csv"},
    )


@app.get("/export/alarms")
def export_alarms_csv():
    query = text("""
        SELECT id, code, message, priority, status, created_at
        FROM alarms
        ORDER BY created_at DESC
        LIMIT 500
    """)
    with engine.connect() as connection:
        rows = connection.execute(query).mappings().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "code", "message", "priority", "status", "created_at"])

    for row in rows:
        writer.writerow([
            row["id"],
            row["code"],
            row["message"],
            row["priority"],
            row["status"],
            row["created_at"],
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=alarms_history.csv"},
    )


@app.get("/export/audit")
def export_audit_csv():
    query = text("""
        SELECT id, actor, action, target, details, created_at
        FROM audit_log
        ORDER BY created_at DESC
        LIMIT 500
    """)
    with engine.connect() as connection:
        rows = connection.execute(query).mappings().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "actor", "action", "target", "details", "created_at"])

    for row in rows:
        writer.writerow([
            row["id"],
            row["actor"],
            row["action"],
            row["target"],
            row["details"],
            row["created_at"],
        ])

    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_log.csv"},
    )


@app.get("/recipes")
def list_recipes():
    return {"rows": get_all_recipes()}


@app.get("/recipes/{recipe_id}")
def read_recipe(recipe_id: int):
    recipe = get_recipe_by_id(recipe_id)
    if not recipe:
        return {"status": "error", "details": "Recipe not found"}

    steps = get_recipe_steps(recipe_id)
    return {"status": "success", "recipe": recipe, "steps": steps}


@app.post("/recipes")
def create_recipe_api(payload: RecipeCreate):
    try:
        recipe_id = create_recipe(
            name=payload.name,
            description=payload.description or "",
            objective=payload.objective or "",
            created_by=payload.created_by or "system",
        )

        save_system_event(
            event_type="recipe_created",
            message=f"Recipe created: {payload.name}",
        )
        save_audit_log(
            actor=payload.created_by or "system",
            action="create_recipe",
            target=payload.name,
            details=f"Recipe id {recipe_id}",
        )

        return {"status": "success", "recipe_id": recipe_id}
    except Exception as e:
        return {"status": "error", "details": str(e)}


@app.put("/recipes/{recipe_id}")
def update_recipe_api(recipe_id: int, payload: RecipeUpdate):
    try:
        update_recipe(
            recipe_id=recipe_id,
            name=payload.name,
            description=payload.description or "",
            objective=payload.objective or "",
            is_active=payload.is_active,
        )

        save_system_event(
            event_type="recipe_updated",
            message=f"Recipe updated: {payload.name}",
        )
        save_audit_log(
            actor=payload.actor or "system",
            action="update_recipe",
            target=str(recipe_id),
            details=f"Recipe updated to {payload.name}",
        )

        return {"status": "success", "recipe_id": recipe_id}
    except Exception as e:
        return {"status": "error", "details": str(e)}


@app.delete("/recipes/{recipe_id}")
def delete_recipe_api(recipe_id: int, actor: str = "system"):
    try:
        recipe = get_recipe_by_id(recipe_id)
        delete_recipe(recipe_id)

        save_system_event(
            event_type="recipe_deleted",
            message=f"Recipe deleted: {recipe_id}",
        )
        save_audit_log(
            actor=actor,
            action="delete_recipe",
            target=str(recipe_id),
            details=f"Deleted recipe {recipe['name'] if recipe else recipe_id}",
        )

        return {"status": "success", "recipe_id": recipe_id}
    except Exception as e:
        return {"status": "error", "details": str(e)}


@app.post("/recipe-steps")
def add_recipe_step_api(payload: RecipeStepCreate):
    try:
        step_id = add_recipe_step(
            recipe_id=payload.recipe_id,
            step_order=payload.step_order,
            step_name=payload.step_name,
            duration_min=payload.duration_min,
            temp_setpoint=payload.temp_setpoint or "",
            ph_setpoint=payload.ph_setpoint or "",
            do_setpoint=payload.do_setpoint or "",
            rpm_setpoint=payload.rpm_setpoint or "",
            notes=payload.notes or "",
        )

        save_system_event(
            event_type="recipe_step_created",
            message=f"Recipe step added to recipe {payload.recipe_id}",
        )
        save_audit_log(
            actor=payload.actor or "system",
            action="create_recipe_step",
            target=str(payload.recipe_id),
            details=f"Step {payload.step_order} - {payload.step_name}",
        )

        return {"status": "success", "step_id": step_id}
    except Exception as e:
        return {"status": "error", "details": str(e)}


@app.put("/recipe-steps/{step_id}")
def update_recipe_step_api(step_id: int, payload: RecipeStepUpdate):
    try:
        update_recipe_step(
            step_id=step_id,
            step_order=payload.step_order,
            step_name=payload.step_name,
            duration_min=payload.duration_min,
            temp_setpoint=payload.temp_setpoint or "",
            ph_setpoint=payload.ph_setpoint or "",
            do_setpoint=payload.do_setpoint or "",
            rpm_setpoint=payload.rpm_setpoint or "",
            notes=payload.notes or "",
        )

        save_system_event(
            event_type="recipe_step_updated",
            message=f"Recipe step updated: {step_id}",
        )
        save_audit_log(
            actor=payload.actor or "system",
            action="update_recipe_step",
            target=str(step_id),
            details=f"Updated step {payload.step_name}",
        )

        return {"status": "success", "step_id": step_id}
    except Exception as e:
        return {"status": "error", "details": str(e)}


@app.delete("/recipe-steps/{step_id}")
def delete_recipe_step_api(step_id: int, actor: str = "system"):
    try:
        delete_recipe_step(step_id)

        save_system_event(
            event_type="recipe_step_deleted",
            message=f"Recipe step deleted: {step_id}",
        )
        save_audit_log(
            actor=actor,
            action="delete_recipe_step",
            target=str(step_id),
            details=f"Deleted recipe step {step_id}",
        )

        return {"status": "success", "step_id": step_id}
    except Exception as e:
        return {"status": "error", "details": str(e)}


@app.get("/batches")
def list_batches():
    return {"rows": get_all_batch_runs()}


@app.get("/batches/current")
def current_batch():
    return {"batch": get_running_batch()}


@app.get("/batches/{batch_id}")
def read_batch(batch_id: int):
    batch = get_batch_by_id(batch_id)
    if not batch:
        return {"status": "error", "details": "Batch not found"}

    notes = get_batch_notes(batch_id)
    recipe = get_recipe_by_id(batch["recipe_id"]) if batch["recipe_id"] else None
    recipe_steps = get_recipe_steps(batch["recipe_id"]) if batch["recipe_id"] else []
    annotations = get_pedagogical_annotations(batch_id)

    return {
        "status": "success",
        "batch": batch,
        "recipe": recipe,
        "recipe_steps": recipe_steps,
        "notes": notes,
        "annotations": annotations,
    }


@app.post("/batches")
def create_batch_api(payload: BatchCreate):
    try:
        batch_id = create_batch_run(
            name=payload.name,
            recipe_id=payload.recipe_id,
            operator_username=payload.operator_username,
            target_duration_min=payload.target_duration_min,
            objective=payload.objective or "",
            notes=payload.notes or "",
        )

        save_system_event(
            event_type="batch_created",
            message=f"Batch created: {payload.name}",
        )
        save_audit_log(
            actor=payload.operator_username,
            action="create_batch",
            target=payload.name,
            details=f"Batch id {batch_id}, recipe id {payload.recipe_id}",
        )

        return {"status": "success", "batch_id": batch_id}
    except Exception as e:
        return {"status": "error", "details": str(e)}


@app.put("/batches/{batch_id}/start")
def start_batch_api(batch_id: int, actor: str = "system"):
    try:
        update_batch_status(batch_id, "running")

        save_system_event(
            event_type="batch_started",
            message=f"Batch started: {batch_id}",
        )
        save_audit_log(
            actor=actor,
            action="start_batch",
            target=str(batch_id),
            details="Batch moved to running",
        )

        return {"status": "success", "batch_id": batch_id, "new_status": "running"}
    except Exception as e:
        return {"status": "error", "details": str(e)}


@app.put("/batches/{batch_id}/stop")
def stop_batch_api(batch_id: int, actor: str = "system"):
    try:
        update_batch_status(batch_id, "completed")

        save_system_event(
            event_type="batch_completed",
            message=f"Batch completed: {batch_id}",
        )
        save_audit_log(
            actor=actor,
            action="stop_batch",
            target=str(batch_id),
            details="Batch moved to completed",
        )

        return {"status": "success", "batch_id": batch_id, "new_status": "completed"}
    except Exception as e:
        return {"status": "error", "details": str(e)}


@app.put("/batches/{batch_id}/abort")
def abort_batch_api(batch_id: int, actor: str = "system"):
    try:
        update_batch_status(batch_id, "aborted")

        save_system_event(
            event_type="batch_aborted",
            message=f"Batch aborted: {batch_id}",
        )
        save_audit_log(
            actor=actor,
            action="abort_batch",
            target=str(batch_id),
            details="Batch moved to aborted",
        )

        return {"status": "success", "batch_id": batch_id, "new_status": "aborted"}
    except Exception as e:
        return {"status": "error", "details": str(e)}


@app.post("/batch-notes")
def create_batch_note_api(payload: BatchNoteCreate):
    try:
        note_id = add_batch_note(
            batch_id=payload.batch_id,
            note_type=payload.note_type or "operator_note",
            note_text=payload.note_text,
            author=payload.author or "system",
        )

        save_system_event(
            event_type="batch_note_added",
            message=f"Note added to batch {payload.batch_id}",
        )
        save_audit_log(
            actor=payload.author or "system",
            action="add_batch_note",
            target=str(payload.batch_id),
            details=payload.note_text,
        )

        return {"status": "success", "note_id": note_id}
    except Exception as e:
        return {"status": "error", "details": str(e)}


@app.get("/batches/{batch_id}/analysis")
def batch_analysis_api(batch_id: int):
    return build_batch_analysis(batch_id)


@app.get("/batches/compare/{batch_a_id}/{batch_b_id}")
def batch_compare_api(batch_a_id: int, batch_b_id: int):
    return build_batch_comparison(batch_a_id, batch_b_id)


@app.post("/annotations")
def create_annotation_api(payload: AnnotationCreate):
    try:
        event_time = payload.event_time
        annotation_id = add_pedagogical_annotation(
            batch_id=payload.batch_id,
            annotation_type=payload.annotation_type or "event",
            title=payload.title,
            description=payload.description or "",
            event_time=event_time,
            tag_name=payload.tag_name or "",
            tag_value=payload.tag_value or "",
            author=payload.author or "system",
        )

        save_system_event(
            event_type="annotation_created",
            message=f"Annotation added to batch {payload.batch_id}",
        )
        save_audit_log(
            actor=payload.author or "system",
            action="create_annotation",
            target=str(payload.batch_id),
            details=payload.title,
        )

        return {"status": "success", "annotation_id": annotation_id}
    except Exception as e:
        return {"status": "error", "details": str(e)}


@app.get("/annotations/{batch_id}")
def list_annotations(batch_id: int):
    return {"rows": get_pedagogical_annotations(batch_id)}


@app.post("/replay-markers")
def create_replay_marker_api(payload: ReplayMarkerCreate):
    try:
        marker_id = add_replay_marker(
            batch_id=payload.batch_id,
            replay_time=payload.replay_time,
            marker_type=payload.marker_type or "phase",
            label=payload.label,
            description=payload.description or "",
        )

        save_system_event(
            event_type="replay_marker_created",
            message=f"Replay marker added to batch {payload.batch_id}",
        )

        return {"status": "success", "marker_id": marker_id}
    except Exception as e:
        return {"status": "error", "details": str(e)}


@app.get("/replay/{batch_id}")
def replay_batch_api(batch_id: int):
    return build_replay_data(batch_id)


@app.get("/batches/{batch_id}/health")
def batch_health_api(batch_id: int):
    analysis = build_batch_analysis(batch_id)
    health = compute_health_from_analysis(analysis)

    if health.get("status") != "success":
        return health

    save_process_health_snapshot(
        batch_id=batch_id,
        health_score=health["health_score"],
        stability_score=health["stability_score"],
        alarm_score=health["alarm_score"],
        recipe_adherence_score=health["recipe_adherence_score"],
        summary=health["summary"],
    )

    return {
        "status": "success",
        "batch": analysis["batch"],
        "health": health,
        "analysis": analysis,
    }


@app.get("/health")
def global_health_api():
    running_batch = get_running_batch()

    if running_batch:
        analysis = build_batch_analysis(running_batch["id"])
        health = compute_health_from_analysis(analysis)

        if health.get("status") == "success":
            return {
                "status": "success",
                "mode": "running_batch",
                "batch": running_batch,
                "health": health,
                "snapshots": get_process_health_snapshots(running_batch["id"], 10),
            }

    snapshots = get_process_health_snapshots(limit=10)
    return {
        "status": "success",
        "mode": "snapshot_only",
        "batch": None,
        "health": None,
        "snapshots": snapshots,
    }