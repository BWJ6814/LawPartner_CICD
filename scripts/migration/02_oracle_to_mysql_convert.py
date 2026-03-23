import argparse
import re
from pathlib import Path


def convert_sql(text: str) -> str:
    out = text

    # Normalize line endings first
    out = out.replace("\r\n", "\n").replace("\r", "\n")

    # Remove Oracle statement separators and SQL*Plus leftovers
    out = re.sub(r"^\s*/\s*$", "", out, flags=re.MULTILINE)
    out = re.sub(r"^\s*SET\s+.*$", "", out, flags=re.IGNORECASE | re.MULTILINE)
    out = re.sub(r"^\s*SPOOL\s+.*$", "", out, flags=re.IGNORECASE | re.MULTILINE)
    out = re.sub(r"^\s*PROMPT\s+.*$", "", out, flags=re.IGNORECASE | re.MULTILINE)
    out = re.sub(r"^\s*COMMENT\s+ON\s+COLUMN\s+.*?;\s*$", "", out, flags=re.IGNORECASE | re.MULTILINE)
    out = re.sub(r"^\s*undefined;\s*$", "", out, flags=re.IGNORECASE | re.MULTILINE)
    out = re.sub(
        r"^\s*DROP\s+TRIGGER\s+IF\s+EXISTS\s+FOURJO\s*;\s*$",
        "",
        out,
        flags=re.IGNORECASE | re.MULTILINE,
    )

    # Remove Oracle schema quoting: "FOURJO"."TB_USER" -> `TB_USER`
    out = re.sub(r'"[A-Za-z0-9_$#]+"\."([A-Za-z0-9_$#]+)"', r'`\1`', out)
    out = re.sub(r'"([A-Za-z0-9_$#]+)"', r'`\1`', out)

    # Basic datatype conversions
    out = re.sub(r"\bVARCHAR2\s*\(", "VARCHAR(", out, flags=re.IGNORECASE)
    out = re.sub(r"\bNVARCHAR2\s*\(", "VARCHAR(", out, flags=re.IGNORECASE)
    out = re.sub(r"\bCLOB\b", "LONGTEXT", out, flags=re.IGNORECASE)
    out = re.sub(r"\bNCLOB\b", "LONGTEXT", out, flags=re.IGNORECASE)
    out = re.sub(r"\bBLOB\b", "LONGBLOB", out, flags=re.IGNORECASE)
    out = re.sub(r"\bDATE\b", "DATETIME", out, flags=re.IGNORECASE)
    out = re.sub(r"\bTIMESTAMP\s*\(\s*\d+\s*\)\b", "DATETIME(6)", out, flags=re.IGNORECASE)
    out = re.sub(r"\bTIMESTAMP\b", "DATETIME(6)", out, flags=re.IGNORECASE)
    out = re.sub(r"\bNUMBER\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)", r"DECIMAL(\1,\2)", out, flags=re.IGNORECASE)
    out = re.sub(r"\bNUMBER\s*\(\s*(\d+)\s*\)", r"BIGINT", out, flags=re.IGNORECASE)
    out = re.sub(r"\bNUMBER\b", "BIGINT", out, flags=re.IGNORECASE)

    # Identity / defaults
    out = re.sub(
        r"GENERATED\s+(?:ALWAYS\s+|BY\s+DEFAULT\s+)?AS\s+IDENTITY",
        "AUTO_INCREMENT",
        out,
        flags=re.IGNORECASE,
    )
    out = re.sub(r"\bSYSTIMESTAMP\b", "CURRENT_TIMESTAMP(6)", out, flags=re.IGNORECASE)
    out = re.sub(r"\bSYSDATE\b", "CURRENT_TIMESTAMP", out, flags=re.IGNORECASE)
    out = re.sub(r"DATETIME\(6\)\(6\)", "DATETIME(6)", out, flags=re.IGNORECASE)

    # TO_DATE / TO_TIMESTAMP conversion used by Oracle inserts
    out = re.sub(
        r"TO_DATE\(\s*'([^']+)'\s*,\s*'[^']+'\s*\)",
        r"STR_TO_DATE('\1', '%Y-%m-%d %H:%i:%s')",
        out,
        flags=re.IGNORECASE,
    )
    out = re.sub(
        r"TO_TIMESTAMP\(\s*'([^']+)'\s*,\s*'[^']+'\s*\)",
        r"STR_TO_DATE('\1', '%Y-%m-%d %H:%i:%s')",
        out,
        flags=re.IGNORECASE,
    )

    # Oracle string literal N'...' -> '...'
    out = re.sub(r"\bN'([^']*)'", r"'\1'", out)

    # Remove unsupported Oracle clauses that appear in metadata dumps
    out = re.sub(r"\bUSING INDEX\b.*?(?=,|\))", "", out, flags=re.IGNORECASE | re.DOTALL)
    out = re.sub(r"\bENABLE\b", "", out, flags=re.IGNORECASE)
    out = re.sub(r"\bNOVALIDATE\b", "", out, flags=re.IGNORECASE)
    # Oracle-generated CHECK constraints frequently conflict in MySQL (e.g., NOT NULL checks on AUTO_INCREMENT)
    out = re.sub(
        r",?\s*CONSTRAINT\s+`?[A-Za-z0-9_$#]+`?\s+CHECK\s*\([^)]*\)\s*",
        "",
        out,
        flags=re.IGNORECASE,
    )
    # Remove Oracle hidden-column indexes (SYS_NC...), they are not valid in MySQL.
    out = re.sub(
        r"^\s*CREATE\s+INDEX\s+[A-Za-z0-9_$#`]+\s+ON\s+[A-Za-z0-9_$#`]+\s*\(\s*`?SYS_NC[0-9]+\$`?\s*\)\s*;\s*$",
        "",
        out,
        flags=re.IGNORECASE | re.MULTILINE,
    )

    # TRIGGER / PACKAGE / FUNCTION / PROCEDURE blocks are Oracle-specific.
    # Keep as comments so import won't fail; user can rewrite separately.
    out = re.sub(
        r"(?is)\bCREATE\s+OR\s+REPLACE\s+(TRIGGER|PACKAGE|PACKAGE BODY|FUNCTION|PROCEDURE)\b.*?(?=^\s*/\s*$|$)",
        lambda m: "-- SKIPPED ORACLE OBJECT (manual conversion required)\n-- " + re.sub(r"\n", "\n-- ", m.group(0)),
        out,
        flags=re.MULTILINE,
    )

    # Clean repeated blank lines
    out = re.sub(r"\n{3,}", "\n\n", out)

    header = (
        "-- Auto-converted from Oracle SQL (best effort)\n"
        "-- Review especially: TRIGGER/PROCEDURE/FUNCTION, indexes, FK options, date defaults\n"
        "SET NAMES utf8mb4;\n"
        "SET FOREIGN_KEY_CHECKS = 0;\n\n"
    )
    footer = "\nSET FOREIGN_KEY_CHECKS = 1;\n"
    return header + out.strip() + footer


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert Oracle SQL dump to MySQL-friendly SQL.")
    parser.add_argument("--input", required=True, help="Path to Oracle SQL dump file")
    parser.add_argument("--output", required=True, help="Path to output MySQL SQL file")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    text = input_path.read_text(encoding="utf-8", errors="ignore")
    converted = convert_sql(text)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(converted, encoding="utf-8")

    print(f"Converted: {input_path} -> {output_path}")


if __name__ == "__main__":
    main()
