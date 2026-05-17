#!/usr/bin/env bash
# Roteiro de API alinhado ao plano de testes (convite, acompanhantes, check-in / QR).
# Uso: ./scripts/test-convite-api-matrix.sh [BASE_URL]
# Pré-requisito: API Spring em execução (ex.: back/demo + PostgreSQL).

set -euo pipefail
BASE_URL="${1:-http://localhost:8080}"
API="${BASE_URL}/api/convites"

echo "== API matrix: ${API} =="

TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

# 1) Convite com acompanhantes (CPFs distintos)
HTTP_CODE=$(curl -sS -o "$TMP" -w "%{http_code}" -X POST "${API}/criar" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Titular Teste Matrix",
    "cpf": "529.982.247-25",
    "telefone": "11988887777",
    "instagram": "@matrix",
    "placaCarro": "TST-0001",
    "acompanhantes": [
      { "nome": "Acomp", "sobrenome": "Um", "cpf": "111.444.777-35" },
      { "nome": "Acomp", "sobrenome": "Dois", "cpf": "390.533.447-05" }
    ]
  }')
test "$HTTP_CODE" = "200" || { echo "Falha: criar convite com acompanhantes (HTTP $HTTP_CODE)"; cat "$TMP"; exit 1; }
CODIGO=$(python3 -c "import json,sys; print(json.load(open('$TMP'))['codigo'])")
echo "OK: convite criado, codigo=$CODIGO"

# 2) CPF titular duplicado
HTTP_CODE=$(curl -sS -o "$TMP" -w "%{http_code}" -X POST "${API}/criar" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Outro Titular",
    "cpf": "529.982.247-25",
    "telefone": "11900000000",
    "instagram": "@dup",
    "placaCarro": "TST-0002",
    "acompanhantes": []
  }')
test "$HTTP_CODE" = "409" || { echo "Falha: esperava 409 CPF titular duplicado (HTTP $HTTP_CODE)"; cat "$TMP"; exit 1; }
echo "OK: 409 CPF titular duplicado"

# 3) Acompanhante com mesmo CPF do titular
HTTP_CODE=$(curl -sS -o "$TMP" -w "%{http_code}" -X POST "${API}/criar" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Titular Igual Acomp",
    "cpf": "747.553.170-19",
    "telefone": "11911112222",
    "instagram": "@igual",
    "placaCarro": "TST-0003",
    "acompanhantes": [
      { "nome": "X", "sobrenome": "Y", "cpf": "747.553.170-19" }
    ]
  }')
test "$HTTP_CODE" = "409" || { echo "Falha: esperava 409 acompanhante = titular (HTTP $HTTP_CODE)"; cat "$TMP"; exit 1; }
echo "OK: 409 acompanhante igual ao titular"

# 4) Dois acompanhantes com o mesmo CPF
HTTP_CODE=$(curl -sS -o "$TMP" -w "%{http_code}" -X POST "${API}/criar" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Titular Dois Acomp Iguais",
    "cpf": "085.199.970-43",
    "telefone": "11933334444",
    "instagram": "@dois",
    "placaCarro": "TST-0004",
    "acompanhantes": [
      { "nome": "A", "sobrenome": "1", "cpf": "462.178.366-27" },
      { "nome": "B", "sobrenome": "2", "cpf": "462.178.366-27" }
    ]
  }')
test "$HTTP_CODE" = "409" || { echo "Falha: esperava 409 CPF acompanhante duplicado (HTTP $HTTP_CODE)"; cat "$TMP"; exit 1; }
echo "OK: 409 dois acompanhantes com mesmo CPF"

# 5) Check-in primeira vez (código = conteúdo do QR)
HTTP_CODE=$(curl -sS -o "$TMP" -w "%{http_code}" -X POST "${API}/checkin/${CODIGO}")
test "$HTTP_CODE" = "200" || { echo "Falha: check-in primeiro uso (HTTP $HTTP_CODE)"; cat "$TMP"; exit 1; }
USADO=$(python3 -c "import json,sys; print(json.load(open('$TMP'))['usado'])")
test "$USADO" = "True" || test "$USADO" = "true" || { echo "Falha: usado deveria ser true"; exit 1; }
echo "OK: check-in 200, usado=true"

# 6) Check-in repetido
HTTP_CODE=$(curl -sS -o "$TMP" -w "%{http_code}" -X POST "${API}/checkin/${CODIGO}")
test "$HTTP_CODE" = "409" || { echo "Falha: esperava 409 check-in duplicado (HTTP $HTTP_CODE)"; cat "$TMP"; exit 1; }
echo "OK: check-in repetido 409"

# 7) Código inexistente
HTTP_CODE=$(curl -sS -o "$TMP" -w "%{http_code}" -X POST "${API}/checkin/ZZZZZZZZ")
test "$HTTP_CODE" = "404" || { echo "Falha: esperava 404 código inválido (HTTP $HTTP_CODE)"; cat "$TMP"; exit 1; }
echo "OK: check-in código inexistente 404"

echo "== Todos os passos da matrix passaram =="
