import json
import tempfile
import unittest
from pathlib import Path

from bark_push.config_manager import ConfigError, ConfigManager


class TestConfigManager(unittest.TestCase):
    def test_create_default_config(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            state_dir = Path(td) / ".bark-push"
            config_path = state_dir / "config.json"
            mgr = ConfigManager(config_path=config_path, state_dir=state_dir)
            self.assertTrue(config_path.exists())
            raw = json.loads(config_path.read_text(encoding="utf-8"))
            self.assertIn("default_push_url", raw)
            self.assertIn("ciphertext", raw)
            self.assertIn("users", raw)
            self.assertIn("defaults", raw)
            self.assertNotIn("ciphertext", raw.get("defaults", {}))
            self.assertEqual(mgr.config.default_push_url, "https://api.day.app")

    def test_top_level_ciphertext(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            state_dir = Path(td) / ".bark-push"
            config_path = state_dir / "config.json"
            payload = {
                "default_push_url": "https://api.day.app",
                "ciphertext": "secret",
                "users": {"alice": "k"},
                "defaults": {
                    "level": "active",
                    "volume": 10,
                    "badge": 1,
                    "sound": "bell",
                    "icon": "",
                    "group": "default",
                    "call": False,
                    "autoCopy": False,
                    "copy": "",
                    "isArchive": True,
                    "action": "",
                },
                "groups": ["default"],
                "history_limit": 100,
                "enable_update": True,
            }
            config_path.parent.mkdir(parents=True, exist_ok=True)
            config_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            mgr = ConfigManager(config_path=config_path, state_dir=state_dir)
            self.assertEqual(mgr.config.ciphertext, "secret")

    def test_invalid_types(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            state_dir = Path(td) / ".bark-push"
            config_path = state_dir / "config.json"
            payload = {
                "default_push_url": 1,
                "ciphertext": [],
                "users": [],
                "defaults": [],
                "groups": "default",
                "history_limit": "100",
                "enable_update": "true",
            }
            config_path.parent.mkdir(parents=True, exist_ok=True)
            config_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            with self.assertRaises(ConfigError):
                ConfigManager(config_path=config_path, state_dir=state_dir)

    def test_invalid_history_limit(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            state_dir = Path(td) / ".bark-push"
            config_path = state_dir / "config.json"
            payload = {
                "default_push_url": "https://api.day.app",
                "ciphertext": "",
                "users": {"alice": "k"},
                "defaults": {
                    "level": "active",
                    "volume": 10,
                    "badge": 1,
                    "sound": "bell",
                    "icon": "",
                    "group": "default",
                    "call": False,
                    "autoCopy": False,
                    "copy": "",
                    "isArchive": True,
                    "action": "",
                },
                "groups": ["default"],
                "history_limit": 0,
                "enable_update": True,
            }
            config_path.parent.mkdir(parents=True, exist_ok=True)
            config_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            with self.assertRaises(ConfigError):
                ConfigManager(config_path=config_path, state_dir=state_dir)

    def test_invalid_defaults_types(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            state_dir = Path(td) / ".bark-push"
            config_path = state_dir / "config.json"
            payload = {
                "default_push_url": "https://api.day.app",
                "ciphertext": "",
                "users": {"alice": "k"},
                "defaults": {
                    "level": 1,
                    "volume": "10",
                    "badge": "1",
                    "sound": 2,
                    "icon": 3,
                    "group": 4,
                    "call": "false",
                    "autoCopy": "true",
                    "copy": 5,
                    "isArchive": "true",
                    "action": 6,
                },
                "groups": ["default"],
                "history_limit": 100,
                "enable_update": True,
            }
            config_path.parent.mkdir(parents=True, exist_ok=True)
            config_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            with self.assertRaises(ConfigError):
                ConfigManager(config_path=config_path, state_dir=state_dir)


if __name__ == "__main__":
    unittest.main()
