from __future__ import annotations
import unicodedata
import json
import re
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List, Optional

import fitz
import camelot
import pandas as pd

from dataclasses import dataclass, field
from typing import Optional


MODULE_CODE_RE = re.compile(
    r"""
    ^(
        [A-ZÄÖÜ]{1,4}[_ ]\d{3}[A-Za-z]?  
      | [A-ZÄÖÜ][A-Za-z]*_\d{3}[A-Za-z]?  
    )$
    """,
    re.VERBOSE,
)

MODULE_HEADER_WITH_TITLE_RE = re.compile(
    r"""
    ^\s*
    ([A-ZÄÖÜ]{2,4}\s*\d{3}[A-Za-z]?)  
    \s*:\s*
    (.+?)                             
    \s*$
    """,
    re.VERBOSE,
)

MODULNUMMER_RE = re.compile(
    r"^(Modulnummer|Module number)\s+([A-ZÄÖÜ]{2,4}\s*\d{3}[A-Za-z]?)\s*$"
)


SECTION_KEYS = {
    # English
    "Form of module": "form_of_module",
    "Type of module": "type_of_module",
    "Level": "level",
    "ECTS": "ects",
    "Prerequisites": "prerequisites",
    "Aim of module": "aim_of_module",
    "Learning outcomes and qualification goals": "learning_outcomes",
    "Learning outcomes": "learning_outcomes",
    "Methods": "methods",
    "Form of assessment": "form_of_assessment",
    "Admission requirements for assessment": "admission_requirements_for_assessment",
    "Duration of assessment": "duration_of_assessment",
    "Language": "language",
    "Offering": "offering",
    "Offered": "offering",
    "Lecturer": "lecturer",
    "Person in charge": "person_in_charge",
    "Duration of module": "duration_of_module",
    "Further modules": "further_modules",
    "Range of application": "range_of_application",
    "Semester": "semester",
    "Literature": "literature",
    "Media": "media",
    # German
    "Form der Veranstaltung": "form_of_module",
    "Typ der Veranstaltung": "type_of_module",
    "Modulniveau": "level",
    "ECTS": "ects",
    "Vorausgesetzte Kenntnisse": "prerequisites",
    "Lehrinhalte": "aim_of_module",
    "Lern- und Kompetenzziele": "learning_outcomes",
    "Lernziele": "learning_outcomes",
    "Lehr- und Lernmethoden": "methods",
    "Art der Prüfungsleistung": "form_of_assessment",
    "Prüfungsvorleistungen": "admission_requirements_for_assessment",
    "Prüfungsdauer": "duration_of_assessment",
    "Sprache": "language",
    "Angebotsturnus": "offering",
    "Angebotsturnus": "offering",
    "Lehrende/r": "lecturer",
    "Modulverantwortlicher": "person_in_charge",
    "Dauer des Moduls": "duration_of_module",
    "Weiterführende Module": "further_modules",
    "Verwendbarkeit": "range_of_application",
    "Einordnung in Fachsemester": "semester",
    "Begleitende Literatur": "literature",
    "Medienformen": "media",
}


def normalize_heading(line: str) -> str:
    s = line.strip().rstrip(":")
    s = s.lower()
    s = (
        s.replace("ä", "ae")
         .replace("ö", "oe")
         .replace("ü", "ue")
         .replace("ß", "ss")
    )
    return s

NORMALIZED_SECTION_KEYS = {
    normalize_heading(k): v for k, v in SECTION_KEYS.items()
}


@dataclass
class LearningOutcomes:
    expertise: Optional[str] = None
    methodological_competence: Optional[str] = None
    personal_competence: Optional[str] = None


@dataclass
class ModuleJSON:
    moduleno: str
    name: str

    form_of_module: Optional[str] = None
    type_of_module: Optional[str] = None
    level: Optional[str] = None
    ects: Optional[int] = None

    prerequisites: Optional[str] = None
    aim_of_module: Optional[str] = None

    learning_outcomes: LearningOutcomes = field(default_factory=LearningOutcomes)
    literature: Optional[str] = None
    form_of_assessment: Optional[str] = None
    admission_requirements_for_assessment: Optional[str] = None
    duration_of_assessment: Optional[str] = None
    language: Optional[str] = None
    offering: Optional[str] = None
    lecturer: Optional[str] = None
    person_in_charge: Optional[str] = None
    duration_of_module: Optional[str] = None
    further_modules: Optional[str] = None
    range_of_application: Optional[str] = None
    semester: Optional[str] = None



def debug_headings_for_one_module(descriptions: dict):
    for code, info in descriptions.items():
        print("=== Module", code, info["name"], "===")
        raw = info["raw_text"]
        seen = set()
        for line in raw.splitlines():
            norm = normalize_heading(line)
            if norm in NORMALIZED_SECTION_KEYS:
                if line not in seen:
                    print("HEADING:", repr(line), "→", NORMALIZED_SECTION_KEYS[norm])
                    seen.add(line)

def normalize_code(code: str) -> str:
    return re.sub(r"\s+", " ", code.strip())


def pdf_to_lines(pdf_path: str | Path) -> List[str]:
    doc = fitz.open(str(pdf_path))
    lines: List[str] = []
    for page in doc:
        lines.extend(page.get_text("text").splitlines())
    return [l.rstrip("\n") for l in lines]


def is_module_header(lines, idx):
    n = len(lines)
    line = lines[idx].strip()

    m = MODULE_HEADER_WITH_TITLE_RE.match(line)
    if m:
        code = m.group(1).strip()
        name = m.group(2).strip()

        k = idx + 1
        while k < n and not lines[k].strip():
            k += 1

        first_heading_idx = None
        while k < n:
            norm = normalize_heading(lines[k])
            if norm in NORMALIZED_SECTION_KEYS:
                first_heading_idx = k
                break
            k += 1

        if first_heading_idx is None:
            return None

        return {
            "code": code,
            "name": name,
            "form_idx": first_heading_idx,
        }

    m = MODULNUMMER_RE.match(line)
    if m:
        code = m.group(2).strip()
        name = None

        j = idx + 1
        while j < n:
            txt = lines[j].strip()
            if txt.startswith("Titel "):
                name = txt[len("Titel "):].strip()
                break
            if txt.startswith("Title "):
                name = txt[len("Title "):].strip()
                break
            j += 1

        if not name and idx > 0:
            prev = lines[idx - 1].strip()
            pm = MODULE_HEADER_WITH_TITLE_RE.match(prev)
            if pm:
                name = pm.group(2).strip()

        if not name:
            name = code

        k = idx + 1
        while k < n and not lines[k].strip():
            k += 1

        first_heading_idx = None
        while k < n:
            norm = normalize_heading(lines[k])
            if norm in NORMALIZED_SECTION_KEYS:
                first_heading_idx = k
                break
            k += 1

        if first_heading_idx is None:
            return None

        return {
            "code": code,
            "name": name,
            "form_idx": first_heading_idx,
        }

    if not MODULE_CODE_RE.match(line):
        return None

    code = line.strip()

    j = idx + 1
    while j < n and not lines[j].strip():
        j += 1

    if j < n and MODULE_CODE_RE.match(lines[j].strip()):
        j += 1
        while j < n and not lines[j].strip():
            j += 1

    if j >= n:
        return None

    name = lines[j].strip()
    if not name:
        return None

    k = j + 1
    while k < n and not lines[k].strip():
        k += 1

    first_heading_idx = None
    while k < n:
        norm = normalize_heading(lines[k])
        if norm in NORMALIZED_SECTION_KEYS:
            first_heading_idx = k
            break
        k += 1

    if first_heading_idx is None:
        return None

    return {
        "code": code,
        "name": name,
        "form_idx": first_heading_idx,
    }


def extract_module_descriptions(pdf_path: str) -> dict:
    lines = pdf_to_lines(pdf_path)
    n = len(lines)

    header_infos = []
    i = 0
    while i < n:
        h = is_module_header(lines, i)
        if h:
            header_infos.append((i, h))
            i = h["form_idx"] + 1
        else:
            i += 1

    modules = {}
    for idx, (start_idx, info) in enumerate(header_infos):
        code = info["code"]
        name = info["name"]
        form_idx = info["form_idx"]

        content_start = form_idx
        if idx + 1 < len(header_infos):
            next_start = header_infos[idx + 1][0]
            content_end = next_start
        else:
            content_end = n

        raw_block = "\n".join(lines[content_start:content_end]).strip()

        modules[code] = {
            "moduleno": code,
            "name": name,
            "raw_text": raw_block,
        }

    return modules



def split_sections(raw_text: str) -> dict:
    lines = [l.strip() for l in raw_text.splitlines()]
    result: dict[str, str] = {}

    current_norm_heading = None
    buf: list[str] = []

    def commit():
        nonlocal buf, current_norm_heading
        if current_norm_heading is not None and buf:
            field_name = NORMALIZED_SECTION_KEYS[current_norm_heading]
            result[field_name] = "\n".join(buf).strip()
        buf = []

    i = 0
    while i < len(lines):
        line = lines[i]
        norm = normalize_heading(line)
        if norm.startswith("zulassungsvoraussetzungen") and i + 1 < len(lines):
            next_norm = normalize_heading(lines[i + 1])
            if next_norm.startswith("zur pruefung"):
                combined = "Zulassungsvoraussetzungen zur Prüfung"
                norm = normalize_heading(combined)
                i += 1

        if norm in NORMALIZED_SECTION_KEYS:
            commit()
            current_norm_heading = norm
        else:
            if current_norm_heading is not None:
                buf.append(line)
        i += 1

    commit()
    return result

def parse_learning_outcomes(text: Optional[str]) -> LearningOutcomes:
    if not text:
        return LearningOutcomes()

    parts = LearningOutcomes()

    blocks = re.split(
        r"(Expertise:|Methodological competence:|Personal competence:)",
        text,
    )

    current = None
    buf: List[str] = []
    for tok in blocks:
        tok = tok.strip()
        if tok in ("Expertise:", "Methodological competence:", "Personal competence:"):
            if current and buf:
                setattr(parts, current, " ".join(buf).strip())
            if tok == "Expertise:":
                current = "expertise"
            elif tok.startswith("Methodological"):
                current = "methodological_competence"
            else:
                current = "personal_competence"
            buf = []
        else:
            if current:
                buf.append(tok)

    if current and buf:
        setattr(parts, current, " ".join(buf).strip())

    if not (parts.expertise or parts.methodological_competence or parts.personal_competence):
        parts.expertise = text.strip()

    return parts

def extract_overview_tables(pdf_path: str | Path, pages: str) -> pd.DataFrame:
    tables = camelot.read_pdf(str(pdf_path), pages=pages, flavor="lattice")

    dfs = []
    for t in tables:
        df = t.df.copy()
        if df.empty:
            continue

        header = [c.strip().lower() for c in df.iloc[0].tolist()]
        df = df.iloc[1:]
        df.columns = header

        if not any("module" in h for h in header):
            continue

        dfs.append(df)

    if not dfs:
        return pd.DataFrame()

    overview = pd.concat(dfs, ignore_index=True)

    rename_map = {}
    moduleno_mapped = False  

    for col in overview.columns:
        c = col.strip().lower()
        if c.startswith("module") and not moduleno_mapped:
            rename_map[col] = "moduleno"
            moduleno_mapped = True
        elif c.startswith("module"):
            continue
        elif "name" in c and "module" in c:
            rename_map[col] = "name"
        elif "ects" in c:
            rename_map[col] = "ects"
        elif "type of module" in c or c == "type":
            rename_map[col] = "type_of_module"
        elif "level" in c:
            rename_map[col] = "level"

    overview.rename(columns=rename_map, inplace=True)

    if "moduleno" in overview.columns:
        col = overview["moduleno"]
        if isinstance(col, pd.DataFrame):
            col = col.iloc[:, 0]

        col = col.astype(str)
        col = col.str.replace(r"\s+", " ", regex=True)
        col = col.str.strip()
        overview["moduleno"] = col

    if "ects" in overview.columns:
        col = overview["ects"]
        if isinstance(col, pd.DataFrame):
            col = col.iloc[:, 0]

        col = col.astype(str).str.extract(r"(\d+)", expand=False)
        overview["ects"] = col.astype("Int64")

    return overview

def build_modules_from_catalog(
    pdf_path: str | Path,
    overview_pages: Optional[str] = None,
) -> List[ModuleJSON]:
    descriptions = extract_module_descriptions(pdf_path)
    debug_headings_for_one_module(descriptions)
    if overview_pages:
        overview_df = extract_overview_tables(pdf_path, overview_pages)
    else:
        overview_df = pd.DataFrame()

    overview_map: dict[str, pd.Series] = {}
    if not overview_df.empty and "moduleno" in overview_df.columns:
        for _, row in overview_df.iterrows():
            key = row["moduleno"]
            if isinstance(key, pd.Series):
                key = key.iloc[0]
            key = normalize_code(key)
            overview_map[key] = row

    modules: List[ModuleJSON] = []

    for code, info in descriptions.items():
        code_norm = normalize_code(code)
        sections = split_sections(info["raw_text"])

        ov = overview_map.get(code_norm)

        name = info["name"]
        if ov is not None and "name" in ov and isinstance(ov["name"], str) and ov["name"].strip():
            name = ov["name"].strip()

        ects = None

        if "ects" in sections and sections["ects"]:
            m = re.search(r"(\d+)", sections["ects"])
            if m:
                ects = int(m.group(1))

        if ov is not None and "ects" in ov and pd.notna(ov["ects"]):
            try:
                ects = int(ov["ects"])
            except Exception:
                pass

        level = sections.get("level")
        if ov is not None and "level" in ov and isinstance(ov["level"], str) and ov["level"].strip():
            level = ov["level"].strip()

        type_of_module = None
        if ov is not None and "type_of_module" in ov and isinstance(ov["type_of_module"], str):
            type_of_module = ov["type_of_module"].strip()
        if not type_of_module:
            type_of_module = sections.get("type_of_module")

        learning_outcomes = parse_learning_outcomes(sections.get("learning_outcomes"))

        mjson = ModuleJSON(
            moduleno=code_norm,
            name=name,
            form_of_module=sections.get("form_of_module"),
            type_of_module=type_of_module,
            level=level,
            ects=ects,
            prerequisites=sections.get("prerequisites"),
            aim_of_module=sections.get("aim_of_module"),
            learning_outcomes=learning_outcomes,
            literature=sections.get("literature"),
            form_of_assessment=sections.get("form_of_assessment"),
            admission_requirements_for_assessment=sections.get(
                "admission_requirements_for_assessment"
            ),
            duration_of_assessment=sections.get("duration_of_assessment"),
            language=sections.get("language"),
            offering=sections.get("offering"),
            lecturer=sections.get("lecturer"),
            person_in_charge=sections.get("person_in_charge"),
            duration_of_module=sections.get("duration_of_module"),
            further_modules=sections.get("further_modules"),
            range_of_application=sections.get("range_of_application"),
            semester=sections.get("semester"),
        )

        modules.append(mjson)

    return modules


def catalog_to_json(
    pdf_path: str | Path,
    output_json_path: str | Path,
    overview_pages: Optional[str] = None,
):
    modules = build_modules_from_catalog(pdf_path, overview_pages)

    def to_plain_dict(m: ModuleJSON):
        d = asdict(m)
        return d

    plain = [to_plain_dict(m) for m in modules]

    with open(output_json_path, "w", encoding="utf-8") as f:
        json.dump(plain, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    pdf = Path("data/module_catalogs/mmds.pdf")
    out = Path("data/preprocessed/test.json")

    overview_pages = ""

    catalog_to_json(pdf, out, overview_pages=overview_pages)
    print(f"Wrote {out}")
