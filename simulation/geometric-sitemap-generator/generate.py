#!/usr/bin/env python3
"""
Simple runner script for generating site maps.
Avoids relative import issues.
"""

import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

# Now run the CLI
from cli import main

if __name__ == "__main__":
    main()
