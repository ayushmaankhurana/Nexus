#!/usr/bin/env bash

total=5
passed=0

print_check() {
  local label="$1"
  local status="$2"
  local detail="$3"

  if [ "$status" -eq 0 ]; then
    printf "✅ %s\n" "$label"
    passed=$((passed + 1))
  else
    if [ -n "$detail" ]; then
      printf "❌ %s - %s\n" "$label" "$detail"
    else
      printf "❌ %s\n" "$label"
    fi
  fi
}

check_docker() {
  if ! docker info >/dev/null 2>&1; then
    print_check "Docker is running and nexus-db container is healthy" 1 "Docker is not running"
    return
  fi

  if docker ps | grep -q "nexus-db"; then
    print_check "Docker is running and nexus-db container is healthy" 0
  else
    print_check "Docker is running and nexus-db container is healthy" 1 "nexus-db is not listed by docker ps"
  fi
}

check_env() {
  local env_file="backend/api-gateway/.env"
  local missing=""

  if [ ! -f "$env_file" ]; then
    print_check "backend/api-gateway/.env exists and has required keys" 1 ".env file is missing"
    return
  fi

  for key in JWT_SECRET DATABASE_URL DEMO_SECRET; do
    if ! grep -q "^${key}=" "$env_file"; then
      missing="${missing}${missing:+, }${key}"
    fi
  done

  if [ -z "$missing" ]; then
    print_check "backend/api-gateway/.env exists and has required keys" 0
  else
    print_check "backend/api-gateway/.env exists and has required keys" 1 "missing ${missing}"
  fi
}

check_prisma() {
  local output

  output=$(cd backend/api-gateway && npx prisma migrate status 2>&1)
  if printf "%s" "$output" | grep -q "Database schema is up to date"; then
    print_check "Prisma migrations are up to date" 0
  else
    print_check "Prisma migrations are up to date" 1 "migrate status did not report an up-to-date schema"
  fi
}

check_backend() {
  local http_code

  http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null)
  if [ "$http_code" = "200" ]; then
    print_check "Backend health endpoint responds" 0
  else
    print_check "Backend health endpoint responds" 1 "HTTP ${http_code:-000}"
  fi
}

check_frontend() {
  local http_code

  http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null)
  if [ "$http_code" = "200" ]; then
    print_check "Frontend dev server responds on port 5173" 0
  else
    print_check "Frontend dev server responds on port 5173" 1 "HTTP ${http_code:-000}"
  fi
}

check_docker
check_env
check_prisma
check_backend
check_frontend

printf "%s/%s checks passed\n" "$passed" "$total"

if [ "$passed" -eq "$total" ]; then
  exit 0
fi

exit 1
