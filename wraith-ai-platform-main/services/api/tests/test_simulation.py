from __future__ import annotations

import ast
from pathlib import Path

from app.simulation import simulate_shell


def test_virtual_shell_is_deterministic_and_refuses_network() -> None:
    assert simulate_shell("whoami") == ("demo", 0)
    output, code = simulate_shell("curl hxxp://payload.example/test")
    assert "network access is disabled" in output
    assert code == 126
    assert simulate_shell("whoami") == ("demo", 0)


def test_virtual_shell_module_has_no_execution_primitives() -> None:
    source = (Path(__file__).resolve().parents[1] / "app" / "simulation.py").read_text(encoding="utf-8")
    tree = ast.parse(source)
    forbidden_imports = {"os", "subprocess", "requests", "httpx", "urllib", "socket"}
    forbidden_calls = {"eval", "exec", "compile", "open", "__import__"}
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            assert not ({alias.name.split(".")[0] for alias in node.names} & forbidden_imports)
        if isinstance(node, ast.ImportFrom) and node.module:
            assert node.module.split(".")[0] not in forbidden_imports
        if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
            assert node.func.id not in forbidden_calls

