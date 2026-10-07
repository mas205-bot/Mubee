from pathlib import Path
import shutil
import subprocess
import sys


PROJECT_DIR = Path(__file__).resolve().parent


def main() -> int:
    node = shutil.which("node")
    if node is None:
        print("Node.js is required to start this app.", file=sys.stderr)
        return 1

    tsx_cli = PROJECT_DIR / "node_modules" / "tsx" / "dist" / "cli.mjs"
    if not tsx_cli.is_file():
        print("The app dependencies are missing. Install them before starting the app.", file=sys.stderr)
        return 1

    try:
        return subprocess.call([node, str(tsx_cli), "server.ts"], cwd=PROJECT_DIR)
    except KeyboardInterrupt:
        print("\nStopping the app...")
        return 130


if __name__ == "__main__":
    raise SystemExit(main())