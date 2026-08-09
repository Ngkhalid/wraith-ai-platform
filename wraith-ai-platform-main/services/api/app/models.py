"""Validated API request models."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field, field_validator


class VirtualShellRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    command: str = Field(min_length=1, max_length=256)

    @field_validator("command")
    @classmethod
    def single_line_printable(cls, value: str) -> str:
        if "\n" in value or "\r" in value or "\x00" in value:
            raise ValueError("command must be a single printable line")
        if any(ord(character) < 32 and character != "\t" for character in value):
            raise ValueError("command contains control characters")
        return value


class VirtualShellResponse(BaseModel):
    session_id: str
    command: str
    output: str
    exit_code: int
    executed: bool = False
    network_access: bool = False
    sandbox: str = "deterministic-simulation-only"

