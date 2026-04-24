import math
import random
import threading
import time

from app.core.db import save_realtime_value, save_historical_value, get_setting

_simulation_started = False


def simulation_loop():
    t = 0.0

    while True:
        try:
            source_mode = get_setting("source_mode", "simulation")

            if source_mode != "simulation":
                time.sleep(2)
                continue

            temp = 37.0 + 0.8 * math.sin(t / 6.0) + random.uniform(-0.15, 0.15)
            ph = 6.9 + 0.18 * math.sin(t / 8.0 + 0.5) + random.uniform(-0.03, 0.03)
            do = 62.0 + 12.0 * math.sin(t / 5.0 + 1.1) + random.uniform(-1.5, 1.5)
            rpm = 300 + 35 * math.sin(t / 7.0) + random.randint(-6, 6)

            do = max(15.0, min(95.0, do))
            ph = max(5.8, min(7.4, ph))
            temp = max(34.0, min(40.0, temp))
            rpm = max(180, min(520, rpm))

            pump1 = "true" if math.sin(t / 9.0) > 0.55 else "false"
            pump2 = "true" if math.sin(t / 11.0 + 0.8) > 0.70 else "false"
            pump3 = "true" if math.sin(t / 13.0 + 1.1) > 0.82 else "false"

            gas1 = "true"
            gas2 = "true" if do < 45 else "false"
            gas3 = "true" if do < 35 else "false"
            gas4 = "false"

            payload = {
                "temp_reactor": round(temp, 2),
                "ph_value": round(ph, 2),
                "do_percent": round(do, 2),
                "stirrer_rpm": int(round(rpm)),
                "pump1_state": pump1,
                "pump2_state": pump2,
                "pump3_state": pump3,
                "gas1_state": gas1,
                "gas2_state": gas2,
                "gas3_state": gas3,
                "gas4_state": gas4,
                "process_state": "running",
                "comm_status": "ok",
                "data_quality": "good",
                "source_mode": "simulation",
            }

            for tag_name, tag_value in payload.items():
                save_realtime_value(tag_name, tag_value)
                save_historical_value(tag_name, tag_value)

            t += 1.0
            time.sleep(3)

        except Exception:
            time.sleep(3)


def start_simulation_background():
    global _simulation_started

    if _simulation_started:
        return

    thread = threading.Thread(target=simulation_loop, daemon=True)
    thread.start()
    _simulation_started = True