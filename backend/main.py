from datetime import datetime
from io import StringIO
import csv

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import text

from app.core.bootstrap_schema import init_database
from app.core.db import (
    engine,
    test_database_connection,
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
    save_system_event,
    save_realtime_value,
    save_historical_value,
    save_alarm,
)

app = FastAPI(title="BioFlo Supervision API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://bioflo-frontend.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    username: str
    password: str


class SettingUpdateRequest(BaseModel):
    setting_key: str
    setting_value: str
    value_type: str = "string"
    actor: str = "admin"


class RecipeCreateRequest(BaseModel):
    name: str
    description: str = ""
    objective: str = ""
    created_by: str = "admin"


class RecipeUpdateRequest(BaseModel):
    name: str
    description: str = ""
    objective: str = ""
    is_active: bool = True


class RecipeStepCreateRequest(BaseModel):
    step_order: int
    step_name: str
    duration_min: int = 0
    temp_setpoint: float | None = None
    ph_setpoint: float | None = None
    do_setpoint: float | None = None
    rpm_setpoint: float | None = None
    notes: str = ""


class RecipeStepUpdateRequest(BaseModel):
    step_order: int
    step_name: str
    duration_min: int = 0
    temp_setpoint: float | None = None
    ph_setpoint: float | None = None
    do_setpoint: float | None = None
    rpm_setpoint: float | None = None
    notes: str = ""


class BatchCreateRequest(BaseModel):
    name: str
    recipe_id: int
    operator_username: str
    target_duration_min: int = 0
    objective: str = ""
    notes: str = ""


class BatchNoteCreateRequest(BaseModel):
    batch_id: int
    note_type: str = "operator_note"
    note_text: str
    author: str


class AnnotationCreateRequest(BaseModel):
    batch_id: int
    annotation_type: str = "event"
    title: str
    description: str = ""
    event_time: str | None = None
    tag_name: str = ""
    tag_value: str = ""
    author: str


def ensure_default_settings():
    defaults = [
        ("source_mode", "simulation", "string"),
        ("process_state", "running", "string"),
        ("comm_status", "ok", "string"),
        ("data_quality", "good", "string"),
        ("health_warning_threshold", "70", "number"),
        ("health_critical_threshold", "40", "number"),
    ]
    for key, value, vtype in defaults:
        if get_setting(key) is None:
            update_setting(key, value, vtype)


def ensure_default_realtime_values():
    defaults = {
        "temp_reactor": "37.0",
        "ph_value": "6.90",
        "do_percent": "62.0",
        "stirrer_rpm": "300",
        "pump1_state": "false",
        "pump2_state": "false",
        "pump3_state": "false",
        "gas1_state": "true",
        "gas2_state": "false",
        "gas3_state": "false",
        "gas4_state": "false",
        "process_state": "running",
        "comm_status": "ok",
        "data_quality": "good",
        "source_mode": "simulation",
    }
    for key, value in defaults.items():
        save_realtime_value(key, value)


def ensure_default_users():
    query = text(
        """
        INSERT INTO app_users (username, password, role, full_name, is_active)
        VALUES
            ('viewer', 'viewer123', 'viewer', 'Viewer User', TRUE),
            ('operator', 'operator123', 'operator', 'Operator User', TRUE),
            ('supervisor', 'supervisor123', 'supervisor', 'Supervisor User', TRUE),
            ('admin', 'admin123', 'admin', 'Administrator', TRUE)
        ON CONFLICT (username) DO NOTHING
        """
    )
    with engine.begin() as connection:
        connection.execute(query)


@app.on_event("startup")
def startup_tasks():
    init_database()
    ensure_default_users()
    ensure_default_settings()
    ensure_default_realtime_values()
    save_system_event("startup", "BioFlo backend started")


def parse_bool(value):
    return str(value).lower() in ["1", "true", "yes", "on"]


def get_db_realtime_rows():
    query = text(
        """
        SELECT tag_name, tag_value, updated_at
        FROM realtime_values
        ORDER BY tag_name ASC
        """
    )
    with engine.connect() as connection:
        rows = connection.execute(query).mappings().all()
    return [dict(row) for row in rows]


def get_realtime_payload():
    rows = get_db_realtime_rows()
    values = {row["tag_name"]: row["tag_value"] for row in rows}

    return {
        "source_mode": values.get("source_mode", get_setting("source_mode", "simulation")),
        "comm_status": values.get("comm_status", get_setting("comm_status", "ok")),
        "data_quality": values.get("data_quality", get_setting("data_quality", "good")),
        "process_state": values.get("process_state", get_setting("process_state", "running")),
        "temp_reactor": float(values.get("temp_reactor", 37.0)),
        "ph_value": float(values.get("ph_value", 6.9)),
        "do_percent": float(values.get("do_percent", 60.0)),
        "stirrer_rpm": float(values.get("stirrer_rpm", 300)),
        "pump1_state": parse_bool(values.get("pump1_state", "false")),
        "pump2_state": parse_bool(values.get("pump2_state", "false")),
        "pump3_state": parse_bool(values.get("pump3_state", "false")),
        "gas1_state": parse_bool(values.get("gas1_state", "true")),
        "gas2_state": parse_bool(values.get("gas2_state", "false")),
        "gas3_state": parse_bool(values.get("gas3_state", "false")),
        "gas4_state": parse_bool(values.get("gas4_state", "false")),
    }


def get_active_alarms():
    query = text(
        """
        SELECT id, code, message, priority, status, created_at
        FROM alarms
        WHERE status IN ('active', 'acknowledged')
        ORDER BY created_at DESC
        """
    )
    with engine.connect() as connection:
        rows = connection.execute(query).mappings().all()
    return [dict(row) for row in rows]


def get_all_alarms(limit=200):
    query = text(
        """
        SELECT id, code, message, priority, status, created_at
        FROM alarms
        ORDER BY created_at DESC
        LIMIT :limit
        """
    )
    with engine.connect() as connection:
        rows = connection.execute(query, {"limit": limit}).mappings().all()
    return [dict(row) for row in rows]


def get_system_events(limit=200):
    query = text(
        """
        SELECT id, event_type, message, created_at
        FROM system_events
        ORDER BY created_at DESC
        LIMIT :limit
        """
    )
    with engine.connect() as connection:
        rows = connection.execute(query, {"limit": limit}).mappings().all()
    return [dict(row) for row in rows]


def get_batch_window(batch):
    start_time = batch.get("start_time") or batch.get("created_at")
    end_time = batch.get("end_time") or datetime.utcnow()
    return start_time, end_time


def get_tag_stats(tag_name, start_time, end_time):
    rows = get_history_values_between(tag_name, start_time, end_time)
    if not rows:
        return {
            "points": [],
            "stats": {"count": 0, "min": None, "max": None, "avg": None, "delta": None},
            "out_of_range": {"count": 0, "percent": 0},
        }

    values = []
    points = []
    for row in rows:
        try:
            value = float(row["tag_value"])
            values.append(value)
            points.append({"recorded_at": row["recorded_at"], "tag_value": value})
        except Exception:
            continue

    if not values:
        return {
            "points": [],
            "stats": {"count": 0, "min": None, "max": None, "avg": None, "delta": None},
            "out_of_range": {"count": 0, "percent": 0},
        }

    rules = {
        "temp_reactor": (34, 40),
        "ph_value": (6.0, 7.5),
        "do_percent": (20, 100),
        "stirrer_rpm": (100, 1200),
    }
    low, high = rules.get(tag_name, (-999999, 999999))
    out_count = len([v for v in values if v < low or v > high])

    return {
        "points": points,
        "stats": {
            "count": len(values),
            "min": round(min(values), 3),
            "max": round(max(values), 3),
            "avg": round(sum(values) / len(values), 3),
            "delta": round(max(values) - min(values), 3),
        },
        "out_of_range": {
            "count": out_count,
            "percent": round((out_count / len(values)) * 100, 2),
        },
    }


def get_recipe_targets(recipe_id):
    steps = get_recipe_steps(recipe_id)
    if not steps:
        return {}

    fields = ["temp_setpoint", "ph_setpoint", "do_setpoint", "rpm_setpoint"]
    targets = {}
    for field in fields:
        vals = [step[field] for step in steps if step.get(field) is not None]
        if vals:
            targets[field] = round(sum(vals) / len(vals), 3)
    return targets


def build_batch_analysis(batch_id):
    batch = get_batch_by_id(batch_id)
    if not batch:
        return None

    start_time, end_time = get_batch_window(batch)

    temp_data = get_tag_stats("temp_reactor", start_time, end_time)
    ph_data = get_tag_stats("ph_value", start_time, end_time)
    do_data = get_tag_stats("do_percent", start_time, end_time)
    rpm_data = get_tag_stats("stirrer_rpm", start_time, end_time)

    alarms = get_alarms_between(start_time, end_time)
    alarms_by_code = {}
    for alarm in alarms:
        alarms_by_code[alarm["code"]] = alarms_by_code.get(alarm["code"], 0) + 1

    recipe_targets = get_recipe_targets(batch["recipe_id"])
    recipe_comparison = {
        "temp_reactor": {
            "target_avg": recipe_targets.get("temp_setpoint"),
            "deviation": None
            if temp_data["stats"]["avg"] is None or recipe_targets.get("temp_setpoint") is None
            else round(temp_data["stats"]["avg"] - recipe_targets["temp_setpoint"], 3),
        },
        "ph_value": {
            "target_avg": recipe_targets.get("ph_setpoint"),
            "deviation": None
            if ph_data["stats"]["avg"] is None or recipe_targets.get("ph_setpoint") is None
            else round(ph_data["stats"]["avg"] - recipe_targets["ph_setpoint"], 3),
        },
        "do_percent": {
            "target_avg": recipe_targets.get("do_setpoint"),
            "deviation": None
            if do_data["stats"]["avg"] is None or recipe_targets.get("do_setpoint") is None
            else round(do_data["stats"]["avg"] - recipe_targets["do_setpoint"], 3),
        },
        "stirrer_rpm": {
            "target_avg": recipe_targets.get("rpm_setpoint"),
            "deviation": None
            if rpm_data["stats"]["avg"] is None or recipe_targets.get("rpm_setpoint") is None
            else round(rpm_data["stats"]["avg"] - recipe_targets["rpm_setpoint"], 3),
        },
    }

    observations = []
    if temp_data["out_of_range"]["percent"] > 10:
        observations.append("La température a passé une part significative du batch hors plage.")
    if ph_data["out_of_range"]["percent"] > 10:
        observations.append("Le pH présente des écarts notables par rapport à la plage attendue.")
    if do_data["stats"]["avg"] is not None and do_data["stats"]["avg"] < 30:
        observations.append("Le DO moyen est faible, ce qui peut indiquer une forte demande en oxygène.")
    if len(alarms) > 0:
        observations.append(f"{len(alarms)} événements d’alarme ont été enregistrés pendant ce batch.")
    if not observations:
        observations.append("Le batch semble globalement stable et sans anomalie majeure.")

    actual_duration_min = None
    try:
        delta = end_time - start_time
        actual_duration_min = round(delta.total_seconds() / 60, 2)
    except Exception:
        actual_duration_min = None

    return {
        "status": "success",
        "batch": batch,
        "time_window": {
            "start_time": start_time,
            "end_time": end_time,
            "actual_duration_min": actual_duration_min,
        },
        "tags": {
            "temp_reactor": temp_data,
            "ph_value": ph_data,
            "do_percent": do_data,
            "stirrer_rpm": rpm_data,
        },
        "alarm_summary": {
            "total_alarm_events": len(alarms),
            "alarms_by_code": alarms_by_code,
        },
        "recipe_comparison": recipe_comparison,
        "observations": observations,
    }


def build_health_from_analysis(analysis):
    tags = analysis["tags"]
    alarm_total = analysis["alarm_summary"]["total_alarm_events"]

    out_values = [
        tags["temp_reactor"]["out_of_range"]["percent"],
        tags["ph_value"]["out_of_range"]["percent"],
        tags["do_percent"]["out_of_range"]["percent"],
        tags["stirrer_rpm"]["out_of_range"]["percent"],
    ]
    avg_out = sum(out_values) / len(out_values)

    stability_score = max(0, round(100 - avg_out, 2))
    alarm_score = max(0, round(100 - min(alarm_total * 8, 100), 2))

    recipe_dev_values = []
    for key in analysis["recipe_comparison"]:
        dev = analysis["recipe_comparison"][key]["deviation"]
        if dev is not None:
            recipe_dev_values.append(abs(dev))

    if recipe_dev_values:
        avg_dev = sum(recipe_dev_values) / len(recipe_dev_values)
        recipe_adherence_score = max(0, round(100 - min(avg_dev * 10, 100), 2))
    else:
        recipe_adherence_score = 85.0

    health_score = round(
        (stability_score * 0.4) + (alarm_score * 0.3) + (recipe_adherence_score * 0.3),
        2,
    )

    if health_score >= 85:
        summary = "Procédé en bon état global."
    elif health_score >= 65:
        summary = "Procédé acceptable avec quelques écarts à surveiller."
    else:
        summary = "Procédé dégradé, analyse détaillée recommandée."

    return {
        "health_score": health_score,
        "stability_score": stability_score,
        "alarm_score": alarm_score,
        "recipe_adherence_score": recipe_adherence_score,
        "summary": summary,
    }


def get_global_health():
    running = get_running_batch()
    if running:
        analysis = build_batch_analysis(running["id"])
        return build_health_from_analysis(analysis)

    snapshots = get_process_health_snapshots(limit=1)
    if snapshots:
        last = snapshots[0]
        return {
            "health_score": last["health_score"],
            "stability_score": last["stability_score"],
            "alarm_score": last["alarm_score"],
            "recipe_adherence_score": last["recipe_adherence_score"],
            "summary": last["summary"],
        }

    return {
        "health_score": 90,
        "stability_score": 90,
        "alarm_score": 100,
        "recipe_adherence_score": 85,
        "summary": "Aucun batch actif, dernier état nominal.",
    }


def compare_batches(batch_a_id, batch_b_id):
    analysis_a = build_batch_analysis(batch_a_id)
    analysis_b = build_batch_analysis(batch_b_id)

    if not analysis_a or not analysis_b:
        return None

    comparison = {}
    for key in ["temp_reactor", "ph_value", "do_percent", "stirrer_rpm"]:
        a_avg = analysis_a["tags"][key]["stats"]["avg"]
        b_avg = analysis_b["tags"][key]["stats"]["avg"]
        a_out = analysis_a["tags"][key]["out_of_range"]["percent"]
        b_out = analysis_b["tags"][key]["out_of_range"]["percent"]
        a_dev = analysis_a["recipe_comparison"][key]["deviation"]
        b_dev = analysis_b["recipe_comparison"][key]["deviation"]

        comparison[key] = {
            "batch_a_avg": a_avg,
            "batch_b_avg": b_avg,
            "avg_difference": None if a_avg is None or b_avg is None else round(a_avg - b_avg, 3),
            "batch_a_out_percent": a_out,
            "batch_b_out_percent": b_out,
            "batch_a_recipe_deviation": a_dev,
            "batch_b_recipe_deviation": b_dev,
        }

    summary = []
    if analysis_a["alarm_summary"]["total_alarm_events"] != analysis_b["alarm_summary"]["total_alarm_events"]:
        summary.append(
            f"Les batchs ont un comportement différent en nombre d’alarmes : "
            f"{analysis_a['alarm_summary']['total_alarm_events']} vs {analysis_b['alarm_summary']['total_alarm_events']}."
        )
    if comparison["do_percent"]["avg_difference"] is not None:
        summary.append(
            f"Différence moyenne de DO entre les deux batchs : {comparison['do_percent']['avg_difference']}."
        )
    if not summary:
        summary.append("Les deux batchs présentent un comportement global proche sur les indicateurs calculés.")

    return {
        "status": "success",
        "batch_a": analysis_a,
        "batch_b": analysis_b,
        "comparison": comparison,
        "summary": summary,
    }


@app.get("/")
def root():
    return {"message": "BioFlo Supervision backend is running", "status": "ok"}


@app.get("/status")
def status():
    return {
        "status": "ok",
        "mode": get_setting("source_mode", "simulation"),
        "message": "Backend operational",
    }


@app.get("/db-status")
def db_status():
    try:
        test_database_connection()
        return {"database": "connected"}
    except Exception as exc:
        return {"database": "error", "details": str(exc)}


@app.post("/login")
def login(payload: LoginRequest):
    user = authenticate_user(payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    save_audit_log(payload.username, "login", "app", "Successful login")
    return {"status": "success", "user": user}


@app.get("/users")
def list_users():
    return {"rows": get_all_users()}


@app.get("/source-mode")
def source_mode():
    return {"source_mode": get_setting("source_mode", "simulation")}
@app.get("/seed-default-users")
def seed_default_users():
    query = text(
        """
        INSERT INTO app_users (username, password, role, full_name, is_active)
        VALUES
            ('viewer', 'viewer123', 'viewer', 'Viewer User', TRUE),
            ('operator', 'operator123', 'operator', 'Operator User', TRUE),
            ('supervisor', 'supervisor123', 'supervisor', 'Supervisor User', TRUE),
            ('admin', 'admin123', 'admin', 'Administrator', TRUE)
        ON CONFLICT (username) DO UPDATE SET
            password = EXCLUDED.password,
            role = EXCLUDED.role,
            full_name = EXCLUDED.full_name,
            is_active = EXCLUDED.is_active
        """
    )
    with engine.begin() as connection:
        connection.execute(query)

    return {"status": "success", "message": "Default users seeded"}


@app.get("/set-source-mode/{mode}")
def set_source_mode(mode: str, actor: str = Query(default="admin")):
    if mode not in ["simulation", "live_bioflo"]:
        raise HTTPException(status_code=400, detail="Invalid source mode")

    update_setting("source_mode", mode, "string")
    save_realtime_value("source_mode", mode)
    save_system_event("source_mode_changed", f"Source mode changed to {mode}")
    save_audit_log(actor, "set_source_mode", "app_settings", mode)

    return {"status": "updated", "source_mode": mode}


@app.get("/realtime")
def realtime():
    return get_realtime_payload()


@app.get("/db-realtime")
def db_realtime():
    return {"rows": get_db_realtime_rows()}


@app.get("/alarms")
def alarms():
    rows = get_active_alarms()
    active_alarms = [row for row in rows if row["status"] == "active"]
    acknowledged_alarms = [row for row in rows if row["status"] == "acknowledged"]

    return {
        "global_status": "ok" if len(active_alarms) == 0 else "warning",
        "active_count": len(active_alarms),
        "acknowledged_count": len(acknowledged_alarms),
        "active_alarms": rows,
    }


@app.get("/db-alarms")
def db_alarms():
    return {"rows": get_all_alarms()}


@app.get("/ack-alarm/{code}")
def ack_alarm(code: str, actor: str = Query(default="operator")):
    query = text(
        """
        UPDATE alarms
        SET status = 'acknowledged'
        WHERE code = :code AND status = 'active'
        """
    )
    with engine.begin() as connection:
        connection.execute(query, {"code": code})

    save_audit_log(actor, "ack_alarm", code, "Alarm acknowledged")
    return {"status": "acknowledged", "code": code}


@app.get("/ack-all-alarms")
def ack_all_alarms(actor: str = Query(default="operator")):
    query = text(
        """
        UPDATE alarms
        SET status = 'acknowledged'
        WHERE status = 'active'
        """
    )
    with engine.begin() as connection:
        connection.execute(query)

    save_audit_log(actor, "ack_all_alarms", "alarms", "All active alarms acknowledged")
    return {"status": "acknowledged_all"}


@app.get("/db-events")
def db_events():
    return {"rows": get_system_events()}


@app.get("/audit-logs")
def audit_logs():
    return {"rows": get_audit_logs(200)}


@app.get("/export/audit")
def export_audit():
    rows = get_audit_logs(500)

    buffer = StringIO()
    writer = csv.writer(buffer)
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

    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_log.csv"},
    )


@app.get("/settings")
def settings():
    return {"rows": get_all_settings()}


@app.post("/settings")
def save_setting(payload: SettingUpdateRequest):
    update_setting(payload.setting_key, payload.setting_value, payload.value_type)
    save_audit_log(payload.actor, "update_setting", payload.setting_key, payload.setting_value)
    return {"status": "success"}


@app.get("/recipes")
def recipes():
    return {"rows": get_all_recipes()}


@app.get("/recipes/{recipe_id}")
def recipe_details(recipe_id: int):
    recipe = get_recipe_by_id(recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return {
        "status": "success",
        "recipe": recipe,
        "steps": get_recipe_steps(recipe_id),
    }


@app.post("/recipes")
def create_recipe_route(payload: RecipeCreateRequest):
    recipe_id = create_recipe(
        payload.name,
        payload.description,
        payload.objective,
        payload.created_by,
    )
    save_audit_log(payload.created_by, "create_recipe", str(recipe_id), payload.name)
    return {"status": "success", "recipe_id": recipe_id}


@app.put("/recipes/{recipe_id}")
def update_recipe_route(recipe_id: int, payload: RecipeUpdateRequest):
    update_recipe(
        recipe_id,
        payload.name,
        payload.description,
        payload.objective,
        payload.is_active,
    )
    return {"status": "success"}


@app.delete("/recipes/{recipe_id}")
def delete_recipe_route(recipe_id: int):
    delete_recipe(recipe_id)
    return {"status": "success"}


@app.post("/recipes/{recipe_id}/steps")
def add_recipe_step_route(recipe_id: int, payload: RecipeStepCreateRequest):
    step_id = add_recipe_step(
        recipe_id,
        payload.step_order,
        payload.step_name,
        payload.duration_min,
        payload.temp_setpoint,
        payload.ph_setpoint,
        payload.do_setpoint,
        payload.rpm_setpoint,
        payload.notes,
    )
    return {"status": "success", "step_id": step_id}


@app.put("/recipe-steps/{step_id}")
def update_recipe_step_route(step_id: int, payload: RecipeStepUpdateRequest):
    update_recipe_step(
        step_id,
        payload.step_order,
        payload.step_name,
        payload.duration_min,
        payload.temp_setpoint,
        payload.ph_setpoint,
        payload.do_setpoint,
        payload.rpm_setpoint,
        payload.notes,
    )
    return {"status": "success"}


@app.delete("/recipe-steps/{step_id}")
def delete_recipe_step_route(step_id: int):
    delete_recipe_step(step_id)
    return {"status": "success"}


@app.get("/batches")
def batches():
    return {"rows": get_all_batch_runs()}


@app.get("/batches/current")
def current_batch():
    return {"batch": get_running_batch()}


@app.get("/batches/{batch_id}")
def batch_details(batch_id: int):
    batch = get_batch_by_id(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    recipe = get_recipe_by_id(batch["recipe_id"])
    recipe_steps = get_recipe_steps(batch["recipe_id"])
    notes = get_batch_notes(batch_id)
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
def create_batch(payload: BatchCreateRequest):
    batch_id = create_batch_run(
        payload.name,
        payload.recipe_id,
        payload.operator_username,
        payload.target_duration_min,
        payload.objective,
        payload.notes,
    )
    save_audit_log(payload.operator_username, "create_batch", str(batch_id), payload.name)
    save_system_event("batch_created", f"Batch {payload.name} created")
    return {"status": "success", "batch_id": batch_id}


@app.put("/batches/{batch_id}/start")
def start_batch(batch_id: int, actor: str = Query(default="operator")):
    update_batch_status(batch_id, "running")
    save_audit_log(actor, "start_batch", str(batch_id), "")
    save_system_event("batch_started", f"Batch {batch_id} started")
    return {"status": "success"}


@app.put("/batches/{batch_id}/stop")
def stop_batch(batch_id: int, actor: str = Query(default="operator")):
    update_batch_status(batch_id, "completed")
    save_audit_log(actor, "stop_batch", str(batch_id), "")
    save_system_event("batch_completed", f"Batch {batch_id} completed")
    return {"status": "success"}


@app.put("/batches/{batch_id}/abort")
def abort_batch(batch_id: int, actor: str = Query(default="operator")):
    update_batch_status(batch_id, "aborted")
    save_audit_log(actor, "abort_batch", str(batch_id), "")
    save_system_event("batch_aborted", f"Batch {batch_id} aborted")
    return {"status": "success"}


@app.post("/batch-notes")
def create_batch_note(payload: BatchNoteCreateRequest):
    note_id = add_batch_note(
        payload.batch_id,
        payload.note_type,
        payload.note_text,
        payload.author,
    )
    save_audit_log(payload.author, "add_batch_note", str(payload.batch_id), payload.note_type)
    return {"status": "success", "note_id": note_id}


@app.get("/batches/{batch_id}/analysis")
def batch_analysis(batch_id: int):
    analysis = build_batch_analysis(batch_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Batch not found")
    return analysis


@app.get("/batches/compare/{batch_a_id}/{batch_b_id}")
def compare_batch_route(batch_a_id: int, batch_b_id: int):
    result = compare_batches(batch_a_id, batch_b_id)
    if not result:
        raise HTTPException(status_code=404, detail="One or both batches not found")
    return result


@app.get("/batches/{batch_id}/health")
def batch_health(batch_id: int):
    analysis = build_batch_analysis(batch_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Batch not found")

    health = build_health_from_analysis(analysis)
    save_process_health_snapshot(
        batch_id,
        health["health_score"],
        health["stability_score"],
        health["alarm_score"],
        health["recipe_adherence_score"],
        health["summary"],
    )
    return {"status": "success", "health": health}


@app.get("/health")
def global_health():
    return {
        "health": get_global_health(),
        "snapshots": get_process_health_snapshots(limit=20),
    }


@app.get("/replay/{batch_id}")
def replay(batch_id: int):
    batch = get_batch_by_id(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    start_time, end_time = get_batch_window(batch)

    return {
        "status": "success",
        "batch": batch,
        "time_window": {
            "start_time": start_time,
            "end_time": end_time,
        },
        "tags": {
            "temp_reactor": get_tag_stats("temp_reactor", start_time, end_time)["points"],
            "ph_value": get_tag_stats("ph_value", start_time, end_time)["points"],
            "do_percent": get_tag_stats("do_percent", start_time, end_time)["points"],
            "stirrer_rpm": get_tag_stats("stirrer_rpm", start_time, end_time)["points"],
        },
        "alarms": get_alarms_between(start_time, end_time),
        "annotations": get_pedagogical_annotations(batch_id),
        "markers": get_replay_markers(batch_id),
    }


@app.get("/annotations/{batch_id}")
def get_annotations(batch_id: int):
    return {"rows": get_pedagogical_annotations(batch_id)}


@app.post("/annotations")
def create_annotation(payload: AnnotationCreateRequest):
    annotation_id = add_pedagogical_annotation(
        payload.batch_id,
        payload.annotation_type,
        payload.title,
        payload.description,
        payload.event_time,
        payload.tag_name,
        payload.tag_value,
        payload.author,
    )
    save_audit_log(payload.author, "add_annotation", str(payload.batch_id), payload.title)
    return {"status": "success", "annotation_id": annotation_id}