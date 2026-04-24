import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

BASE_DIR = Path(__file__).resolve().parents[2]
ENV_PATH = BASE_DIR / ".env"

if ENV_PATH.exists():
    load_dotenv(ENV_PATH)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not defined")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)


def test_database_connection():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return True


def save_realtime_value(tag_name, tag_value):
    query = text("""
        INSERT INTO realtime_values (tag_name, tag_value, updated_at)
        VALUES (:tag_name, :tag_value, CURRENT_TIMESTAMP)
        ON CONFLICT (tag_name)
        DO UPDATE SET
            tag_value = EXCLUDED.tag_value,
            updated_at = CURRENT_TIMESTAMP
    """)
    with engine.begin() as connection:
        connection.execute(query, {"tag_name": tag_name, "tag_value": str(tag_value)})


def save_historical_value(tag_name, tag_value):
    query = text("""
        INSERT INTO historical_values (tag_name, tag_value, recorded_at)
        VALUES (:tag_name, :tag_value, CURRENT_TIMESTAMP)
    """)
    with engine.begin() as connection:
        connection.execute(query, {"tag_name": tag_name, "tag_value": str(tag_value)})


def save_alarm(code, message, priority, status):
    query = text("""
        INSERT INTO alarms (code, message, priority, status, created_at)
        VALUES (:code, :message, :priority, :status, CURRENT_TIMESTAMP)
    """)
    with engine.begin() as connection:
        connection.execute(
            query,
            {
                "code": code,
                "message": message,
                "priority": priority,
                "status": status,
            },
        )


def save_system_event(event_type, message):
    query = text("""
        INSERT INTO system_events (event_type, message, created_at)
        VALUES (:event_type, :message, CURRENT_TIMESTAMP)
    """)
    with engine.begin() as connection:
        connection.execute(
            query,
            {
                "event_type": event_type,
                "message": message,
            },
        )


def get_all_settings():
    query = text("""
        SELECT setting_key, setting_value, value_type, updated_at
        FROM app_settings
        ORDER BY setting_key
    """)
    try:
        with engine.connect() as connection:
            rows = connection.execute(query).mappings().all()
        return [dict(row) for row in rows]
    except SQLAlchemyError:
        return []


def get_setting(setting_key, default_value=None):
    query = text("""
        SELECT setting_value
        FROM app_settings
        WHERE setting_key = :setting_key
        LIMIT 1
    """)
    try:
        with engine.connect() as connection:
            row = connection.execute(query, {"setting_key": setting_key}).mappings().first()
        if row:
            return row["setting_value"]
        return default_value
    except SQLAlchemyError:
        return default_value


def update_setting(setting_key, setting_value, value_type="string"):
    query = text("""
        INSERT INTO app_settings (setting_key, setting_value, value_type, updated_at)
        VALUES (:setting_key, :setting_value, :value_type, CURRENT_TIMESTAMP)
        ON CONFLICT (setting_key)
        DO UPDATE SET
            setting_value = EXCLUDED.setting_value,
            value_type = EXCLUDED.value_type,
            updated_at = CURRENT_TIMESTAMP
    """)
    with engine.begin() as connection:
        connection.execute(
            query,
            {
                "setting_key": setting_key,
                "setting_value": str(setting_value),
                "value_type": value_type,
            },
        )


def get_all_users():
    query = text("""
        SELECT id, username, role, full_name, is_active, created_at
        FROM app_users
        ORDER BY username
    """)
    with engine.connect() as connection:
        rows = connection.execute(query).mappings().all()
    return [dict(row) for row in rows]


def authenticate_user(username, password):
    query = text("""
        SELECT id, username, role, full_name, is_active
        FROM app_users
        WHERE username = :username
          AND password = :password
          AND is_active = TRUE
        LIMIT 1
    """)
    with engine.connect() as connection:
        row = connection.execute(
            query,
            {"username": username, "password": password}
        ).mappings().first()

    if row:
        return dict(row)
    return None


def save_audit_log(actor, action, target, details=""):
    query = text("""
        INSERT INTO audit_log (actor, action, target, details, created_at)
        VALUES (:actor, :action, :target, :details, CURRENT_TIMESTAMP)
    """)
    with engine.begin() as connection:
        connection.execute(
            query,
            {
                "actor": actor,
                "action": action,
                "target": target,
                "details": details,
            },
        )


def get_audit_logs(limit=100):
    query = text("""
        SELECT id, actor, action, target, details, created_at
        FROM audit_log
        ORDER BY created_at DESC
        LIMIT :limit
    """)
    with engine.connect() as connection:
        rows = connection.execute(query, {"limit": limit}).mappings().all()
    return [dict(row) for row in rows]


def get_all_recipes():
    query = text("""
        SELECT id, name, description, objective, created_by, is_active, created_at
        FROM recipes
        ORDER BY created_at DESC, name ASC
    """)
    with engine.connect() as connection:
        rows = connection.execute(query).mappings().all()
    return [dict(row) for row in rows]


def get_recipe_by_id(recipe_id):
    query = text("""
        SELECT id, name, description, objective, created_by, is_active, created_at
        FROM recipes
        WHERE id = :recipe_id
        LIMIT 1
    """)
    with engine.connect() as connection:
        row = connection.execute(query, {"recipe_id": recipe_id}).mappings().first()
    return dict(row) if row else None


def get_recipe_steps(recipe_id):
    query = text("""
        SELECT
            id,
            recipe_id,
            step_order,
            step_name,
            duration_min,
            temp_setpoint,
            ph_setpoint,
            do_setpoint,
            rpm_setpoint,
            notes,
            created_at
        FROM recipe_steps
        WHERE recipe_id = :recipe_id
        ORDER BY step_order ASC, id ASC
    """)
    with engine.connect() as connection:
        rows = connection.execute(query, {"recipe_id": recipe_id}).mappings().all()
    return [dict(row) for row in rows]


def create_recipe(name, description, objective, created_by):
    query = text("""
        INSERT INTO recipes (name, description, objective, created_by, is_active, created_at)
        VALUES (:name, :description, :objective, :created_by, TRUE, CURRENT_TIMESTAMP)
        RETURNING id
    """)
    with engine.begin() as connection:
        row = connection.execute(
            query,
            {
                "name": name,
                "description": description,
                "objective": objective,
                "created_by": created_by,
            },
        ).mappings().first()
    return row["id"]


def update_recipe(recipe_id, name, description, objective, is_active):
    query = text("""
        UPDATE recipes
        SET
            name = :name,
            description = :description,
            objective = :objective,
            is_active = :is_active
        WHERE id = :recipe_id
    """)
    with engine.begin() as connection:
        connection.execute(
            query,
            {
                "recipe_id": recipe_id,
                "name": name,
                "description": description,
                "objective": objective,
                "is_active": is_active,
            },
        )


def delete_recipe(recipe_id):
    query = text("""
        DELETE FROM recipes
        WHERE id = :recipe_id
    """)
    with engine.begin() as connection:
        connection.execute(query, {"recipe_id": recipe_id})


def add_recipe_step(
    recipe_id,
    step_order,
    step_name,
    duration_min,
    temp_setpoint,
    ph_setpoint,
    do_setpoint,
    rpm_setpoint,
    notes,
):
    query = text("""
        INSERT INTO recipe_steps (
            recipe_id,
            step_order,
            step_name,
            duration_min,
            temp_setpoint,
            ph_setpoint,
            do_setpoint,
            rpm_setpoint,
            notes,
            created_at
        )
        VALUES (
            :recipe_id,
            :step_order,
            :step_name,
            :duration_min,
            :temp_setpoint,
            :ph_setpoint,
            :do_setpoint,
            :rpm_setpoint,
            :notes,
            CURRENT_TIMESTAMP
        )
        RETURNING id
    """)
    with engine.begin() as connection:
        row = connection.execute(
            query,
            {
                "recipe_id": recipe_id,
                "step_order": step_order,
                "step_name": step_name,
                "duration_min": duration_min,
                "temp_setpoint": temp_setpoint,
                "ph_setpoint": ph_setpoint,
                "do_setpoint": do_setpoint,
                "rpm_setpoint": rpm_setpoint,
                "notes": notes,
            },
        ).mappings().first()
    return row["id"]


def update_recipe_step(
    step_id,
    step_order,
    step_name,
    duration_min,
    temp_setpoint,
    ph_setpoint,
    do_setpoint,
    rpm_setpoint,
    notes,
):
    query = text("""
        UPDATE recipe_steps
        SET
            step_order = :step_order,
            step_name = :step_name,
            duration_min = :duration_min,
            temp_setpoint = :temp_setpoint,
            ph_setpoint = :ph_setpoint,
            do_setpoint = :do_setpoint,
            rpm_setpoint = :rpm_setpoint,
            notes = :notes
        WHERE id = :step_id
    """)
    with engine.begin() as connection:
        connection.execute(
            query,
            {
                "step_id": step_id,
                "step_order": step_order,
                "step_name": step_name,
                "duration_min": duration_min,
                "temp_setpoint": temp_setpoint,
                "ph_setpoint": ph_setpoint,
                "do_setpoint": do_setpoint,
                "rpm_setpoint": rpm_setpoint,
                "notes": notes,
            },
        )


def delete_recipe_step(step_id):
    query = text("""
        DELETE FROM recipe_steps
        WHERE id = :step_id
    """)
    with engine.begin() as connection:
        connection.execute(query, {"step_id": step_id})


def get_all_batch_runs():
    query = text("""
        SELECT
            b.id,
            b.name,
            b.recipe_id,
            r.name AS recipe_name,
            b.operator_username,
            b.status,
            b.start_time,
            b.end_time,
            b.target_duration_min,
            b.objective,
            b.notes,
            b.created_at
        FROM batch_runs b
        LEFT JOIN recipes r ON r.id = b.recipe_id
        ORDER BY b.created_at DESC, b.id DESC
    """)
    with engine.connect() as connection:
        rows = connection.execute(query).mappings().all()
    return [dict(row) for row in rows]


def get_batch_by_id(batch_id):
    query = text("""
        SELECT
            b.id,
            b.name,
            b.recipe_id,
            r.name AS recipe_name,
            b.operator_username,
            b.status,
            b.start_time,
            b.end_time,
            b.target_duration_min,
            b.objective,
            b.notes,
            b.created_at
        FROM batch_runs b
        LEFT JOIN recipes r ON r.id = b.recipe_id
        WHERE b.id = :batch_id
        LIMIT 1
    """)
    with engine.connect() as connection:
        row = connection.execute(query, {"batch_id": batch_id}).mappings().first()
    return dict(row) if row else None


def get_running_batch():
    query = text("""
        SELECT
            b.id,
            b.name,
            b.recipe_id,
            r.name AS recipe_name,
            b.operator_username,
            b.status,
            b.start_time,
            b.end_time,
            b.target_duration_min,
            b.objective,
            b.notes,
            b.created_at
        FROM batch_runs b
        LEFT JOIN recipes r ON r.id = b.recipe_id
        WHERE b.status = 'running'
        ORDER BY b.start_time DESC NULLS LAST, b.id DESC
        LIMIT 1
    """)
    with engine.connect() as connection:
        row = connection.execute(query).mappings().first()
    return dict(row) if row else None


def create_batch_run(name, recipe_id, operator_username, target_duration_min, objective, notes=""):
    query = text("""
        INSERT INTO batch_runs (
            name,
            recipe_id,
            operator_username,
            status,
            target_duration_min,
            objective,
            notes,
            created_at
        )
        VALUES (
            :name,
            :recipe_id,
            :operator_username,
            'planned',
            :target_duration_min,
            :objective,
            :notes,
            CURRENT_TIMESTAMP
        )
        RETURNING id
    """)
    with engine.begin() as connection:
        row = connection.execute(
            query,
            {
                "name": name,
                "recipe_id": recipe_id,
                "operator_username": operator_username,
                "target_duration_min": target_duration_min,
                "objective": objective,
                "notes": notes,
            },
        ).mappings().first()
    return row["id"]


def update_batch_status(batch_id, status):
    if status == "running":
        query = text("""
            UPDATE batch_runs
            SET
                status = :status,
                start_time = COALESCE(start_time, CURRENT_TIMESTAMP)
            WHERE id = :batch_id
        """)
    elif status in ("completed", "aborted"):
        query = text("""
            UPDATE batch_runs
            SET
                status = :status,
                end_time = CURRENT_TIMESTAMP
            WHERE id = :batch_id
        """)
    else:
        query = text("""
            UPDATE batch_runs
            SET status = :status
            WHERE id = :batch_id
        """)

    with engine.begin() as connection:
        connection.execute(query, {"batch_id": batch_id, "status": status})


def add_batch_note(batch_id, note_type, note_text, author):
    query = text("""
        INSERT INTO batch_notes (
            batch_id,
            note_type,
            note_text,
            author,
            created_at
        )
        VALUES (
            :batch_id,
            :note_type,
            :note_text,
            :author,
            CURRENT_TIMESTAMP
        )
        RETURNING id
    """)
    with engine.begin() as connection:
        row = connection.execute(
            query,
            {
                "batch_id": batch_id,
                "note_type": note_type,
                "note_text": note_text,
                "author": author,
            },
        ).mappings().first()
    return row["id"]


def get_batch_notes(batch_id):
    query = text("""
        SELECT
            id,
            batch_id,
            note_type,
            note_text,
            author,
            created_at
        FROM batch_notes
        WHERE batch_id = :batch_id
        ORDER BY created_at DESC, id DESC
    """)
    with engine.connect() as connection:
        rows = connection.execute(query, {"batch_id": batch_id}).mappings().all()
    return [dict(row) for row in rows]


def get_history_values_between(tag_name, start_time, end_time):
    query = text("""
        SELECT tag_name, tag_value, recorded_at
        FROM historical_values
        WHERE tag_name = :tag_name
          AND recorded_at >= :start_time
          AND recorded_at <= :end_time
        ORDER BY recorded_at ASC
    """)
    with engine.connect() as connection:
        rows = connection.execute(
            query,
            {
                "tag_name": tag_name,
                "start_time": start_time,
                "end_time": end_time,
            },
        ).mappings().all()
    return [dict(row) for row in rows]


def get_alarms_between(start_time, end_time):
    query = text("""
        SELECT id, code, message, priority, status, created_at
        FROM alarms
        WHERE created_at >= :start_time
          AND created_at <= :end_time
        ORDER BY created_at ASC
    """)
    with engine.connect() as connection:
        rows = connection.execute(
            query,
            {
                "start_time": start_time,
                "end_time": end_time,
            },
        ).mappings().all()
    return [dict(row) for row in rows]


def add_pedagogical_annotation(
    batch_id,
    annotation_type,
    title,
    description,
    event_time,
    tag_name,
    tag_value,
    author,
):
    query = text("""
        INSERT INTO pedagogical_annotations (
            batch_id,
            annotation_type,
            title,
            description,
            event_time,
            tag_name,
            tag_value,
            author,
            created_at
        )
        VALUES (
            :batch_id,
            :annotation_type,
            :title,
            :description,
            :event_time,
            :tag_name,
            :tag_value,
            :author,
            CURRENT_TIMESTAMP
        )
        RETURNING id
    """)
    with engine.begin() as connection:
        row = connection.execute(
            query,
            {
                "batch_id": batch_id,
                "annotation_type": annotation_type,
                "title": title,
                "description": description,
                "event_time": event_time,
                "tag_name": tag_name,
                "tag_value": tag_value,
                "author": author,
            },
        ).mappings().first()
    return row["id"]


def get_pedagogical_annotations(batch_id):
    query = text("""
        SELECT
            id,
            batch_id,
            annotation_type,
            title,
            description,
            event_time,
            tag_name,
            tag_value,
            author,
            created_at
        FROM pedagogical_annotations
        WHERE batch_id = :batch_id
        ORDER BY event_time ASC NULLS LAST, created_at ASC
    """)
    with engine.connect() as connection:
        rows = connection.execute(query, {"batch_id": batch_id}).mappings().all()
    return [dict(row) for row in rows]


def add_replay_marker(batch_id, replay_time, marker_type, label, description):
    query = text("""
        INSERT INTO batch_replay_markers (
            batch_id,
            replay_time,
            marker_type,
            label,
            description,
            created_at
        )
        VALUES (
            :batch_id,
            :replay_time,
            :marker_type,
            :label,
            :description,
            CURRENT_TIMESTAMP
        )
        RETURNING id
    """)
    with engine.begin() as connection:
        row = connection.execute(
            query,
            {
                "batch_id": batch_id,
                "replay_time": replay_time,
                "marker_type": marker_type,
                "label": label,
                "description": description,
            },
        ).mappings().first()
    return row["id"]


def get_replay_markers(batch_id):
    query = text("""
        SELECT
            id,
            batch_id,
            replay_time,
            marker_type,
            label,
            description,
            created_at
        FROM batch_replay_markers
        WHERE batch_id = :batch_id
        ORDER BY replay_time ASC, id ASC
    """)
    with engine.connect() as connection:
        rows = connection.execute(query, {"batch_id": batch_id}).mappings().all()
    return [dict(row) for row in rows]


def save_process_health_snapshot(
    batch_id,
    health_score,
    stability_score,
    alarm_score,
    recipe_adherence_score,
    summary,
):
    query = text("""
        INSERT INTO process_health_snapshots (
            batch_id,
            health_score,
            stability_score,
            alarm_score,
            recipe_adherence_score,
            summary,
            created_at
        )
        VALUES (
            :batch_id,
            :health_score,
            :stability_score,
            :alarm_score,
            :recipe_adherence_score,
            :summary,
            CURRENT_TIMESTAMP
        )
        RETURNING id
    """)
    with engine.begin() as connection:
        row = connection.execute(
            query,
            {
                "batch_id": batch_id,
                "health_score": health_score,
                "stability_score": stability_score,
                "alarm_score": alarm_score,
                "recipe_adherence_score": recipe_adherence_score,
                "summary": summary,
            },
        ).mappings().first()
    return row["id"]


def get_process_health_snapshots(batch_id=None, limit=50):
    if batch_id is not None:
        query = text("""
            SELECT
                id,
                batch_id,
                health_score,
                stability_score,
                alarm_score,
                recipe_adherence_score,
                summary,
                created_at
            FROM process_health_snapshots
            WHERE batch_id = :batch_id
            ORDER BY created_at DESC
            LIMIT :limit
        """)
        params = {"batch_id": batch_id, "limit": limit}
    else:
        query = text("""
            SELECT
                id,
                batch_id,
                health_score,
                stability_score,
                alarm_score,
                recipe_adherence_score,
                summary,
                created_at
            FROM process_health_snapshots
            ORDER BY created_at DESC
            LIMIT :limit
        """)
        params = {"limit": limit}

    with engine.connect() as connection:
        rows = connection.execute(query, params).mappings().all()
    return [dict(row) for row in rows]