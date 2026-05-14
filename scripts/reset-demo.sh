#!/usr/bin/env bash

env_file="backend/api-gateway/.env"

if [ -z "${DEMO_SECRET:-}" ] && [ -f "$env_file" ]; then
  DEMO_SECRET=$(
    grep -E '^DEMO_SECRET=' "$env_file" |
      tail -n 1 |
      cut -d '=' -f 2- |
      sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
  )
fi

if [ -z "${DEMO_SECRET:-}" ]; then
  printf "Reset failed — is backend running?\n"
  exit 1
fi

http_code=$(curl -s -o /tmp/nexus-reset-demo-response.txt -w "%{http_code}" -X POST http://localhost:3000/dev/demo/reset -H "x-demo-secret: $DEMO_SECRET")

if [ "$http_code" = "200" ]; then
  printf "Demo reset succeeded.\n"
  cat /tmp/nexus-reset-demo-response.txt
  printf "\n"
  exit 0
fi

printf "Reset failed — is backend running?\n"
exit 1
