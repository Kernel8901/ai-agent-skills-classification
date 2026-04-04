#!/usr/bin/env python3
"""
claw-skill-guard — Security scanner for OpenClaw skills

Scans skills for malware patterns, suspicious URLs, and install traps.

Usage:
    python3 scanner.py scan <path-or-url>
    python3 scanner.py scan-all <directory>
    python3 scanner.py check-url <url>
"""

import os
import sys
import re
import json
import tempfile
import shutil
from urllib.request import urlopen, Request
from urllib.error import URLError
from pathlib import Path

# Risk levels
CRITICAL = "critical"
HIGH = "high"
MEDIUM = "medium"
LOW = "low"

# Patterns to detect
PATTERNS = {
    CRITICAL: [
        {
            "name": "curl_pipe_bash",
            "pattern": r"curl\s+[^|]*\|\s*(ba)?sh",
            "description": "Executes remote script directly without verification"
        },
        {
            "name": "wget_pipe_bash",
            "pattern": r"wget\s+[^|]*\|\s*(ba)?sh",
            "description": "Executes remote script directly without verification"
        },
        {
            "name": "curl_pipe_python",
            "pattern": r"curl\s+[^|]*\|\s*python",
            "description": "Executes remote Python code directly"
        },
        {
            "name": "base64_decode_exec",
            "pattern": r"(base64\s+-d|base64\s+--decode).*\|\s*(ba)?sh",
            "description": "Decodes and executes obfuscated code"
        },
        {
            "name": "eval_base64",
            "pattern": r"eval.*base64",
            "description": "Evaluates base64-encoded code"
        },
        {
            "name": "python_exec_decode",
            "pattern": r"python.*-c.*exec.*decode",
            "description": "Executes decoded Python code"
        },
        {
            "name": "xattr_remove_quarantine",
            "pattern": r"xattr\s+-d\s+com\.apple\.quarantine",
            "description": "Removes macOS Gatekeeper protection"
        },
    ],
    HIGH: [
        {
            "name": "npm_install_unknown",
            "pattern": r"npm\s+install\s+(?!-)[^\s]+",
            "description": "Installs npm package",
            "check_allowlist": "npm_packages"
        },
        {
            "name": "pip_install_unknown",
            "pattern": r"pip3?\s+install\s+(?!-)[^\s]+",
            "description": "Installs pip package",
            "check_allowlist": "pip_packages"
        },
        {
            "name": "brew_install",
            "pattern": r"brew\s+install\s+",
            "description": "Installs Homebrew package"
        },
        {
            "name": "chmod_execute",
            "pattern": r"chmod\s+\+x.*&&.*\./",
            "description": "Makes script executable and runs it"
        },
        {
            "name": "curl_output_execute",
            "pattern": r"curl.*-o\s+\S+.*&&.*\./",
            "description": "Downloads file and executes it"
        },
        {
            "name": "wget_execute",
            "pattern": r"wget.*&&.*(chmod|\./)",
            "description": "Downloads and executes file"
        },
        {
            "name": "git_clone_execute",
            "pattern": r"git\s+clone.*&&.*\./",
            "description": "Clones repo and executes scripts"
        },
    ],
    MEDIUM: [
        {
            "name": "sudo_command",
            "pattern": r"sudo\s+",
            "description": "Requires elevated privileges"
        },
        {
            "name": "curl_download",
            "pattern": r"curl\s+(-[a-zA-Z]+\s+)*https?://",
            "description": "Downloads from URL"
        },
        {
            "name": "wget_download",
            "pattern": r"wget\s+https?://",
            "description": "Downloads from URL"
        },
        {
            "name": "unknown_url",
            "pattern": r"https?://[^\s\)\]\"\'\>]+",
            "description": "External URL",
            "check_allowlist": "urls"
        },
    ],
    LOW: [
        {
            "name": "env_file_access",
            "pattern": r"\.env",
            "description": "References .env file (could access credentials)"
        },
        {
            "name": "ssh_key_access",
            "pattern": r"~?/\.ssh/",
            "description": "References SSH keys"
        },
        {
            "name": "credentials_mention",
            "pattern": r"(api[_-]?key|secret|token|password|credential)",
            "description": "Mentions credentials"
        },
    ]
}

# Known-safe URLs and packages
ALLOWLIST = {
    "urls": [
        r"github\.com",
        r"githubusercontent\.com",
        r"npmjs\.com",
        r"pypi\.org",
        r"docs\.",
        r"remotion\.dev",
        r"remotion\.media",
        r"example\.com",
        r"anthropic\.com",
        r"openai\.com",
        r"clawhub\.com",  # Ironic but needed for legit refs
        r"notion\.so",
        r"exa\.ai",
        r"twitter\.com",
        r"x\.com",
        r"api\.twitter\.com",
        r"api\.x\.com",
        r"youtube\.com",
        r"google\.com",
        r"googleapis\.com",
        r"linkedin\.com",
        r"medium\.com",
    ],
    "npm_packages": [
        "openclaw",
        "@remotion/",
        "typescript",
        "react",
        "next",
        "express",
        "axios",
        "lodash",
    ],
    "pip_packages": [
        "requests",
        "flask",
        "django",
        "pandas",
        "numpy",
        "openai",
        "anthropic",
    ]
}


def is_allowlisted(value, allowlist_key):
    """Check if a value matches any allowlist pattern."""
    if allowlist_key not in ALLOWLIST:
        return False
    for pattern in ALLOWLIST[allowlist_key]:
        if re.search(pattern, value, re.IGNORECASE):
            return True
    return False


def scan_content(content, filename=""):
    """Scan content for suspicious patterns."""
    findings = {CRITICAL: [], HIGH: [], MEDIUM: [], LOW: []}
    lines = content.split("\n")
    
    for line_num, line in enumerate(lines, 1):
        # Skip empty lines and comments
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
            
        for risk_level, patterns in PATTERNS.items():
            for pattern_info in patterns:
                matches = re.finditer(pattern_info["pattern"], line, re.IGNORECASE)
                for match in matches:
                    matched_text = match.group(0)
                    
                    # Check allowlist if applicable
                    if "check_allowlist" in pattern_info:
                        if is_allowlisted(matched_text, pattern_info["check_allowlist"]):
                            continue
                    
                    findings[risk_level].append({
                        "file": filename,
                        "line": line_num,
                        "pattern": pattern_info["name"],
                        "matched": matched_text[:100],  # Truncate long matches
                        "description": pattern_info["description"],
                        "context": line.strip()[:150]
                    })
    
    return findings


def scan_directory(path):
    """Scan all markdown and script files in a directory."""
    all_findings = {CRITICAL: [], HIGH: [], MEDIUM: [], LOW: []}
    
    path = Path(path)
    if not path.exists():
        print(f"Error: Path does not exist: {path}")
        sys.exit(1)
    
    # File extensions to scan
    extensions = {".md", ".sh", ".py", ".js", ".ts"}
    
    for file_path in path.rglob("*"):
        if file_path.suffix.lower() in extensions:
            try:
                content = file_path.read_text(encoding="utf-8", errors="ignore")
                findings = scan_content(content, str(file_path.relative_to(path)))
                for level in all_findings:
                    all_findings[level].extend(findings[level])
            except Exception as e:
                print(f"Warning: Could not read {file_path}: {e}")
    
    return all_findings


def fetch_remote_skill(url):
    """Fetch a skill from a remote URL and scan it."""
    # Handle ClawHub URLs
    if "clawhub.com" in url:
        # Try to get the raw content
        # ClawHub format: https://clawhub.com/user/skill-name
        # This is a simplified version - real implementation would need ClawHub API
        pass
    
    # Handle GitHub URLs
    if "github.com" in url and "/blob/" in url:
        url = url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/")
    
    try:
        req = Request(url, headers={"User-Agent": "claw-skill-guard/1.0"})
        with urlopen(req, timeout=30) as response:
            content = response.read().decode("utf-8")
            return content
    except URLError as e:
        print(f"Error fetching URL: {e}")
        return None


def calculate_risk_level(findings):
    """Calculate overall risk level from findings."""
    if findings[CRITICAL]:
        return CRITICAL
    if findings[HIGH]:
        return HIGH
    if findings[MEDIUM]:
        return MEDIUM
    if findings[LOW]:
        return LOW
    return "safe"


def print_report(findings, source):
    """Print a formatted security report."""
    risk_level = calculate_risk_level(findings)
    total_findings = sum(len(f) for f in findings.values())
    
    print(f"\n🔍 Scanning: {source}")
    print("━" * 50)
    
    # Risk level banner
    risk_colors = {
        CRITICAL: "🔴 CRITICAL",
        HIGH: "🟡 HIGH", 
        MEDIUM: "🟠 MEDIUM",
        LOW: "🟢 LOW",
        "safe": "✅ SAFE"
    }
    print(f"\n⚠️  RISK LEVEL: {risk_colors.get(risk_level, risk_level).upper()}")
    
    if total_findings == 0:
        print("\n✅ No suspicious patterns found.")
        print("\n" + "━" * 50)
        print("✅ RECOMMENDATION: Safe to install")
        return 0
    
    print(f"\n📋 Findings ({total_findings} total):\n")
    
    for level in [CRITICAL, HIGH, MEDIUM, LOW]:
        if findings[level]:
            level_icon = {"critical": "🔴", "high": "🟡", "medium": "🟠", "low": "🟢"}[level]
            print(f"  {level_icon} {level.upper()} ({len(findings[level])})")
            
            for i, finding in enumerate(findings[level]):
                prefix = "  ├─" if i < len(findings[level]) - 1 else "  └─"
                file_info = f"{finding['file']}:" if finding['file'] else ""
                print(f"{prefix} Line {finding['line']}: {finding['matched']}")
                print(f"  │  └─ {finding['description']}")
            print()
    
    print("━" * 50)
    
    if risk_level == CRITICAL:
        print("\n❌ RECOMMENDATION: DO NOT INSTALL")
        print("   This skill contains patterns commonly used in malware.")
        return 2
    elif risk_level == HIGH:
        print("\n⚠️  RECOMMENDATION: MANUAL REVIEW REQUIRED")
        print("   Review each flagged line. Only install if you trust the author")
        print("   and understand what each command does.")
        return 1
    elif risk_level == MEDIUM:
        print("\n⚠️  RECOMMENDATION: Review flagged items")
        print("   Likely safe, but verify the URLs and commands are expected.")
        return 0
    else:
        print("\n✅ RECOMMENDATION: Low risk, likely safe to install")
        return 0


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "scan":
        if len(sys.argv) < 3:
            print("Usage: scanner.py scan <path-or-url>")
            sys.exit(1)
        
        target = sys.argv[2]
        
        if target.startswith("http://") or target.startswith("https://"):
            # Remote URL
            content = fetch_remote_skill(target)
            if content:
                findings = scan_content(content, target)
                exit_code = print_report(findings, target)
                sys.exit(exit_code)
            else:
                print("Failed to fetch remote skill")
                sys.exit(1)
        else:
            # Local path
            path = Path(target)
            if path.is_file():
                content = path.read_text(encoding="utf-8", errors="ignore")
                findings = scan_content(content, path.name)
            else:
                findings = scan_directory(target)
            
            exit_code = print_report(findings, target)
            sys.exit(exit_code)
    
    elif command == "scan-all":
        if len(sys.argv) < 3:
            print("Usage: scanner.py scan-all <directory>")
            sys.exit(1)
        
        directory = sys.argv[2]
        skills_dir = Path(directory)
        
        if not skills_dir.is_dir():
            print(f"Error: {directory} is not a directory")
            sys.exit(1)
        
        print(f"🔍 Scanning all skills in: {directory}\n")
        
        exit_code = 0
        for skill_path in sorted(skills_dir.iterdir()):
            if skill_path.is_dir() and not skill_path.name.startswith("."):
                findings = scan_directory(skill_path)
                result = print_report(findings, skill_path.name)
                exit_code = max(exit_code, result)
                print()
        
        sys.exit(exit_code)
    
    elif command == "check-url":
        if len(sys.argv) < 3:
            print("Usage: scanner.py check-url <url>")
            sys.exit(1)
        
        url = sys.argv[2]
        if is_allowlisted(url, "urls"):
            print(f"✅ URL is allowlisted: {url}")
        else:
            print(f"⚠️  URL is NOT in allowlist: {url}")
            print("   This doesn't mean it's malicious, just unknown.")
    
    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
