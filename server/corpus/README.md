# Corpus legal empaquetado para la app

35 ficheros Markdown (~12 MB) extraídos de `doc/fuentes/legalize-es`
(corpus completo, excluido del repo por tamaño), correspondientes a las
55 leyes citadas en los contenidos que tienen `path` en
`doc/quality/mapa-leyes.json`.

- `mapa.json`: nombre de la ley tal como aparece citada → fichero.
- Los ficheros conservan su nombre original (identificador BOE).

## Regenerar

Si el corpus o el mapa cambian, regenera con:

```bash
python3 - <<'EOF'
import json, os, shutil
m = json.load(open('doc/quality/mapa-leyes.json'))
mapa = {}
for ley, v in m.items():
    p = v.get('path')
    if not p:
        continue
    b = os.path.basename(p)
    shutil.copy(os.path.join('.', p), os.path.join('server/corpus', b))
    mapa[ley] = b
json.dump(mapa, open('server/corpus/mapa.json', 'w'), ensure_ascii=False, indent=1)
EOF
```

El endpoint `GET /api/articulo` del backend sirve los artículos desde aquí.
