#!/usr/bin/env python3
"""
Cria 10 convites aleatórios cobrindo todas as categorias de composição:
  - sem_acompanhante
  - um_acompanhante
  - dois_acompanhantes
  - tres_acompanhantes

Uso:
  python3 scripts/seed_10_convites_aleatorios.py [BASE_URL]
  BASE_URL default: http://localhost:8080

Requer API Spring em execução (POST /api/convites/criar).
"""
from __future__ import annotations

import json
import random
import sys
import urllib.error
import urllib.request

NOMES = (
    "Ana", "Bruno", "Carla", "Daniel", "Elena", "Felipe", "Gabriela", "Henrique",
    "Isabela", "João", "Karina", "Lucas", "Mariana", "Nicolas", "Olivia", "Pedro",
    "Rafaela", "Sergio", "Tatiana", "Vinicius",
)
SOBRENOMES = (
    "Almeida", "Barbosa", "Cardoso", "Dias", "Esteves", "Ferreira", "Gomes", "Henrique",
    "Ibrahim", "Jesus", "Klein", "Lima", "Monteiro", "Nascimento", "Oliveira", "Pereira",
    "Queiroz", "Ribeiro", "Silva", "Teixeira",
)


def gerar_cpf_valido() -> str:
    """Gera 11 dígitos com dígitos verificadores válidos (apenas para testes)."""
    n = [random.randint(0, 9) for _ in range(9)]
    s = sum((10 - i) * n[i] for i in range(9))
    d1 = (11 - (s % 11)) % 10
    n.append(d1)
    s = sum((11 - i) * n[i] for i in range(10))
    d2 = (11 - (s % 11)) % 10
    n.append(d2)
    return "".join(str(x) for x in n)


def formatar_cpf(d: str) -> str:
    return f"{d[:3]}.{d[3:6]}.{d[6:9]}-{d[9:]}"


def pool_cpf(usados: set[str]) -> str:
    while True:
        c = gerar_cpf_valido()
        if c not in usados:
            usados.add(c)
            return c


def placa_aleatoria() -> str:
    letras = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=3))
    nums = "".join(random.choices("0123456789", k=4))
    return f"{letras}-{nums}"


def telefone_aleatorio() -> str:
    return "11" + "".join(random.choices("0123456789", k=9))


def montar_acompanhantes(n: int, usados: set[str]) -> list[dict]:
    out = []
    for _ in range(n):
        out.append({
            "nome": random.choice(NOMES),
            "sobrenome": random.choice(SOBRENOMES),
            "cpf": formatar_cpf(pool_cpf(usados)),
        })
    return out


# 10 convites: rotação pelas 4 categorias (3+3+2+2)
ROTACAO_CATEGORIAS = [
    "sem_acompanhante",
    "um_acompanhante",
    "dois_acompanhantes",
    "tres_acompanhantes",
    "sem_acompanhante",
    "um_acompanhante",
    "dois_acompanhantes",
    "tres_acompanhantes",
    "sem_acompanhante",
    "um_acompanhante",
]

QTD_ACOMP = {
    "sem_acompanhante": 0,
    "um_acompanhante": 1,
    "dois_acompanhantes": 2,
    "tres_acompanhantes": 3,
}


def main() -> int:
    base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8080").rstrip("/")
    url = f"{base}/api/convites/criar"
    usados: set[str] = set()

    print(f"POST {url}\n")

    for i, categoria in enumerate(ROTACAO_CATEGORIAS, start=1):
        n_acomp = QTD_ACOMP[categoria]
        cpf_tit = pool_cpf(usados)
        body = {
            "nome": f"{random.choice(NOMES)} {random.choice(SOBRENOMES)} #{i}",
            "cpf": formatar_cpf(cpf_tit),
            "telefone": telefone_aleatorio(),
            "instagram": f"@conv_{categoria[:4]}_{random.randint(1000, 9999)}",
            "placaCarro": placa_aleatoria(),
            "acompanhantes": montar_acompanhantes(n_acomp, usados),
        }
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            method="POST",
            headers={"Content-Type": "application/json; charset=utf-8"},
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8")
                conv = json.loads(raw)
        except urllib.error.HTTPError as e:
            err = e.read().decode("utf-8", errors="replace")
            print(f"[{i}/10] ERRO {categoria}: HTTP {e.code} {err}")
            return 1
        except urllib.error.URLError as e:
            print(f"[{i}/10] ERRO de rede: {e.reason}. A API está rodando em {base}?")
            return 1

        codigo = conv.get("codigo", "?")
        q = len(conv.get("acompanhantes") or [])
        print(f"[{i}/10] OK  categoria={categoria}  codigo={codigo}  acompanhantes={q}")

    print("\nConcluído: 10 convites criados.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
