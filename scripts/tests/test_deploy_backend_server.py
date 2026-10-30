"""Exercise deployment/rollback control flow without Docker, AWS or SSH.

Run on Linux: python3 -m unittest discover -s scripts/tests -v
"""
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


HELPER = Path(__file__).resolve().parents[1] / "deploy-backend-server.sh"
OLD = "sha256:" + "a" * 64
NEW = "sha256:" + "b" * 64
TARGET = "389049475070.dkr.ecr.eu-central-1.amazonaws.com/casendra-backend@" + NEW
MARKER = "# Managed by scripts/deploy-backend.ps1"

MOCK = r'''#!/usr/bin/env python3
import json, os, pathlib, re, sys
p = pathlib.Path(os.environ["MOCK_STATE"])
s = json.loads(p.read_text())
args = sys.argv[1:]
tool = pathlib.Path(sys.argv[0]).name
def save(): p.write_text(json.dumps(s))
def resolve(ref):
    if ref.startswith("casendra-backend-rollback:"):
        return s["tags"].get(ref)
    if "@sha256:" in ref: return ref.split("@", 1)[1]
    return ref
if tool == "sleep": sys.exit(0)
if tool == "curl":
    if s.get("current") == s.get("bad_health"): sys.exit(22)
    print(json.dumps(dict(status="ok", environment="production", auth_mode="auth0")))
elif args[0] == "compose":
    while args[1] == "-f": args[1:3] = []
    cmd = args[1]
    if cmd == "config": sys.exit(0)
    if cmd == "ps": print("container")
    if cmd == "up":
        ref = re.search(r'image: "([^"]+)"', pathlib.Path("compose.override.yaml").read_text())[1]
        new = resolve(ref)
        s.setdefault("attempts", []).append(new)
        if new == s.get("fail_up"):
            save(); sys.exit(1)
        s["current"] = new
        save()
elif args[:2] == ["image", "tag"]:
    s["tags"][args[3]] = args[2]; save()
elif args[:2] == ["image", "inspect"]:
    ref = resolve(args[-1])
    if ref not in s["images"]: sys.exit(1)
    print(ref)
elif args[0] == "inspect":
    print("true" if "Running" in args[2] else s["current"])
else:
    print("Unexpected Docker command", args, file=sys.stderr); sys.exit(99)
'''


class ServerDeploymentTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.state = self.root / "state.json"
        self.state.write_text(json.dumps({"current": OLD, "images": [OLD, NEW], "tags": {}}))
        (self.root / "compose.yaml").write_text("services: {}\n")
        (self.root / "runtime.env").write_text("SECRET=must-not-be-printed\n")
        self.bin = self.root / "bin"
        self.bin.mkdir()
        for name in ("docker", "curl", "sleep"):
            executable = self.bin / name
            executable.write_text(MOCK)
            executable.chmod(0o755)
        self.helper = self.root / "helper.sh"
        # Only replace the fixed deployment directory; retain the real control flow.
        self.helper.write_text(HELPER.read_text().replace("cd /home/ubuntu/casendra", 'cd "$MOCK_DIRECTORY"'))
        self.env = dict(os.environ, MOCK_DIRECTORY=str(self.root), MOCK_STATE=str(self.state),
                        PATH=str(self.bin) + os.pathsep + os.environ["PATH"])

    def configure(self, **changes):
        s = json.loads(self.state.read_text())
        s.update(changes)
        self.state.write_text(json.dumps(s))

    def run_helper(self, *args):
        result = subprocess.run(["bash", str(self.helper), *args], env=self.env,
                                text=True, capture_output=True, timeout=15)
        self.assertNotIn("must-not-be-printed", result.stdout + result.stderr)
        return result

    def test_success_and_manual_rollback(self):
        result = self.run_helper("deploy", TARGET)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(self.state.read_text())["current"], NEW)
        self.assertIn(TARGET, (self.root / "compose.override.yaml").read_text())
        result = self.run_helper("rollback")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(self.state.read_text())["current"], OLD)

    def test_unhealthy_new_image_restores_previous(self):
        self.configure(bad_health=NEW)
        result = self.run_helper("deploy", TARGET)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Previous backend restored and healthy", result.stderr)
        self.assertEqual(json.loads(self.state.read_text())["current"], OLD)

    def test_failed_recreation_restores_previous(self):
        self.configure(fail_up=NEW)
        result = self.run_helper("deploy", TARGET)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("Previous backend restored and healthy", result.stderr)
        self.assertEqual(json.loads(self.state.read_text())["current"], OLD)

    def test_failed_rollback_is_reported(self):
        self.configure(bad_health=NEW, fail_up=OLD)
        result = self.run_helper("deploy", TARGET)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("ROLLBACK FAILED", result.stderr)

    def test_unrelated_override_is_preserved(self):
        original = "# maintained manually\nservices: {}\n"
        (self.root / "compose.override.yaml").write_text(original)
        result = self.run_helper("deploy", TARGET)
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual((self.root / "compose.override.yaml").read_text(), original)
        self.assertEqual(json.loads(self.state.read_text())["current"], OLD)

    def test_missing_target_does_not_replace_container(self):
        self.configure(images=[OLD])
        result = self.run_helper("deploy", TARGET)
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((self.root / "compose.override.yaml").exists())

    def test_missing_rollback_reference_does_not_replace_container(self):
        result = self.run_helper("rollback")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(json.loads(self.state.read_text())["current"], OLD)


if __name__ == "__main__":
    unittest.main()
