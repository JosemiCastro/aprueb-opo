#!/usr/bin/env python3
"""Verifica los ficheros de temario C1: JSON válido, esquema y citas [[ley | articulo]]."""
import json, re, sys, glob, pathlib

BASE = pathlib.Path(__file__).parent
MAPA = json.load(open(BASE / "server/corpus/mapa.json"))
# key -> set de números de artículo (como aparecen en '###### Artículo N')
ARTS = {}
UNITS = {"primero":1,"segundo":2,"tercero":3,"cuarto":4,"quinto":5,"sexto":6,
"séptimo":7,"septimo":7,"octavo":8,"noveno":9,"diez":10,"once":11,"doce":12,
"trece":13,"catorce":14,"quince":15,"dieciséis":16,"dieciseis":16,
"diecisiete":17,"dieciocho":18,"diecinueve":19,"veinte":20,"veintiuno":21,
"veintidós":22,"veintidos":22,"veintitrés":23,"veintitres":23,"veinticuatro":24,
"veinticinco":25,"veintiséis":26,"veintiseis":26,"veintisiete":27,
"veintiocho":28,"veintinueve":29,"uno":1,"una":1,"dos":2,"tres":3,"cuatro":4,
"cinco":5,"seis":6,"siete":7,"ocho":8,"nueve":9}
TENS = {"treinta":30,"cuarenta":40,"cincuenta":50,"sesenta":60,"setenta":70,
"ochenta":80,"noventa":90}
HUND = {"cien":100,"ciento":100,"doscientos":200,"doscientas":200,
"trescientos":300}

def words_to_num(raw):
    """Convierte 'ciento setenta y seis bis' -> '176 bis'."""
    raw = raw.strip().lower().rstrip(".")
    bis = raw.endswith(" bis")
    if bis:
        raw = raw[:-4]
    toks = [t for t in raw.replace(" y ", " ").split() if t]
    total, cur = 0, 0
    for t in toks:
        if t in UNITS:
            cur += UNITS[t]
        elif t in TENS:
            cur += TENS[t]
        elif t in HUND:
            cur += HUND[t]
        else:
            return None
    total = cur
    if total == 0:
        return None
    return f"{total} bis" if bis else str(total)

def norm_art(raw):
    raw = raw.strip().lower().rstrip(".")
    if re.fullmatch(r"\d+(?:\.\d+)*(?: bis)?", raw):
        return raw
    return words_to_num(raw)

for key, meta in MAPA.items():
    arch = meta.get("archivo")
    if not arch:
        ARTS[key] = None  # sin corpus
        continue
    txt = open(BASE / "server/corpus" / arch, encoding="utf-8").read()
    raws = re.findall(r"^#{1,6}\s+(?:Artículo|Art\.)\s+([^\n.]+)", txt, re.M)
    ARTS[key] = {norm_art(r) for r in raws if norm_art(r)}

CITA = re.compile(r"\[\[\s*([^|\]]+?)\s*\|\s*([^\]]+?)\s*\]\]")
ARTNUM = re.compile(r"^(\d+(?:\.\d+)*)")

def parse_nums(ref):
    # acepta "art. 12", "art. 1.3", "arts. 68, 71 y 82", "arts. 9 a 11"
    m = re.match(r"arts?\.\s*(.+)$", ref.strip())
    if not m:
        return None
    body = m.group(1)
    nums = []
    for tok in re.split(r",|\s+y\s+|\s+a\s+", body):
        t = ARTNUM.match(tok.strip())
        if t:
            nums.append(t.group(1))
        elif tok.strip():
            return None  # token no numérico (p.ej. "disposición")
    return nums

errors, citas_ok = [], 0
MINE = [f"HUE-C1-T{i:02d}" for i in range(1, 9)] + [f"HUE-C1-E{i:02d}" for i in range(1, 13)]
files = sorted(str(BASE / f"app/src/data/c1/temario/{m}.json") for m in MINE)
print(f"Ficheros: {len(files)}")
total_words = 0
for f in files:
    try:
        d = json.load(open(f, encoding="utf-8"))
    except Exception as e:
        errors.append(f"{f}: JSON inválido: {e}")
        continue
    fid = pathlib.Path(f).stem
    for campo, esperado in [("id", fid), ("tema", None), ("tipo", None), ("numero", None), ("titulo", None), ("secciones", None), ("relacionados", None)]:
        if campo not in d:
            errors.append(f"{fid}: falta campo '{campo}'")
    if d.get("tipo") not in ("comun", "especifico"):
        errors.append(f"{fid}: tipo inválido {d.get('tipo')}")
    if not isinstance(d.get("secciones"), list) or len(d.get("secciones", [])) < 2:
        errors.append(f"{fid}: secciones insuficientes")
    for s in d.get("secciones", []):
        if "titulo" not in s or "texto" not in s:
            errors.append(f"{fid}: sección sin titulo/texto")
            continue
        total_words += len(s["texto"].split())
        # markdown permitido: ###, -, 1., **, *cursiva*
        for line in s["texto"].split("\n"):
            ls = line.lstrip()
            if ls.startswith("#") and not ls.startswith("### "):
                errors.append(f"{fid}: cabecera no permitida: {ls[:40]}")
        for ley, ref in CITA.findall(s["texto"]):
            ley = ley.strip()
            if ley not in MAPA:
                errors.append(f"{fid}: clave de ley desconocida: «{ley}»")
                continue
            if MAPA[ley].get("archivo") is None:
                errors.append(f"{fid}: cita con marcador para ley sin corpus: «{ley}»")
                continue
            nums = parse_nums(ref)
            if nums is None:
                errors.append(f"{fid}: formato de artículo no válido: «{ref}»")
                continue
            for n in nums:
                if n not in ARTS[ley]:
                    errors.append(f"{fid}: artículo {n} no existe en «{ley}»")
                else:
                    citas_ok += 1

print(f"Citas con marcador verificadas: {citas_ok}")
print(f"Palabras totales: {total_words}")
if errors:
    print(f"\nERRORES ({len(errors)}):")
    for e in errors[:60]:
        print(" -", e)
    sys.exit(1)
print("OK: sin errores")
