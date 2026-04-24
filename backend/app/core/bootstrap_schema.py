from sqlalchemy import text
from app.core.db import engine


def init_database():
    statements = [
        """
        CREATE TABLE IF NOT EXISTS app_settings (
            setting_key TEXT PRIMARY KEY,
            setting_value TEXT,
            value_type TEXT DEFAULT 'string',
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS realtime_values (
            tag_name TEXT PRIMARY KEY,
            tag_value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS historical_values (
            id SERIAL PRIMARY KEY,
            tag_name TEXT NOT NULL,
            tag_value TEXT,
            recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS alarms (
            id SERIAL PRIMARY KEY,
            code TEXT NOT NULL,
            message TEXT,
            priority TEXT,
            status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS system_events (
            id SERIAL PRIMARY KEY,
            event_type TEXT NOT NULL,
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS app_users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            full_name TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS audit_log (
            id SERIAL PRIMARY KEY,
            actor TEXT,
            action TEXT,
            target TEXT,
            details TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS recipes (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            objective TEXT,
            created_by TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS recipe_steps (
            id SERIAL PRIMARY KEY,
            recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
            step_order INTEGER NOT NULL,
            step_name TEXT NOT NULL,
            duration_min INTEGER DEFAULT 0,
            temp_setpoint DOUBLE PRECISION,
            ph_setpoint DOUBLE PRECISION,
            do_setpoint DOUBLE PRECISION,
            rpm_setpoint DOUBLE PRECISION,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS batch_runs (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL,
            operator_username TEXT,
            status TEXT DEFAULT 'planned',
            start_time TIMESTAMP NULL,
            end_time TIMESTAMP NULL,
            target_duration_min INTEGER DEFAULT 0,
            objective TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS batch_notes (
            id SERIAL PRIMARY KEY,
            batch_id INTEGER REFERENCES batch_runs(id) ON DELETE CASCADE,
            note_type TEXT,
            note_text TEXT,
            author TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS pedagogical_annotations (
            id SERIAL PRIMARY KEY,
            batch_id INTEGER REFERENCES batch_runs(id) ON DELETE CASCADE,
            annotation_type TEXT,
            title TEXT NOT NULL,
            description TEXT,
            event_time TIMESTAMP NULL,
            tag_name TEXT,
            tag_value TEXT,
            author TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS batch_replay_markers (
            id SERIAL PRIMARY KEY,
            batch_id INTEGER REFERENCES batch_runs(id) ON DELETE CASCADE,
            replay_time TIMESTAMP NULL,
            marker_type TEXT,
            label TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        CREATE TABLE IF NOT EXISTS process_health_snapshots (
            id SERIAL PRIMARY KEY,
            batch_id INTEGER REFERENCES batch_runs(id) ON DELETE SET NULL,
            health_score DOUBLE PRECISION,
            stability_score DOUBLE PRECISION,
            alarm_score DOUBLE PRECISION,
            recipe_adherence_score DOUBLE PRECISION,
            summary TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """,
    ]

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))

        connection.execute(
            text(
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
        )