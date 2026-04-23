current_source_mode = "simulation"

ALLOWED_SOURCE_MODES = {"simulation", "live_bioflo"}


def get_source_mode():
    return current_source_mode


def set_source_mode(mode: str):
    global current_source_mode

    if mode not in ALLOWED_SOURCE_MODES:
        raise ValueError(f"Invalid source mode: {mode}")

    current_source_mode = mode
    return current_source_mode