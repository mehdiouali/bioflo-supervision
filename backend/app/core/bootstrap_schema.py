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
            step