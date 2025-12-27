#!/bin/bash

# Script para configurar o arquivo .env.local
# Execute: bash setup-env.sh

echo "🔧 Configuração do .env.local para Lorus Care"
echo "=============================================="
echo ""

# DATABASE_URL
echo "1️⃣  DATABASE_URL (Neon PostgreSQL)"
echo "   Acesse: https://console.neon.tech"
echo "   Cole sua connection string completa:"
read -p "   DATABASE_URL: " DATABASE_URL
echo ""

# BETTER_AUTH_SECRET (gerar automaticamente)
echo "2️⃣  BETTER_AUTH_SECRET (gerando automaticamente...)"
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
echo "   ✅ Gerado: $BETTER_AUTH_SECRET"
echo ""

# GOOGLE_CLIENT_ID
echo "3️⃣  GOOGLE_CLIENT_ID"
echo "   Acesse: https://console.cloud.google.com/apis/credentials"
read -p "   GOOGLE_CLIENT_ID: " GOOGLE_CLIENT_ID
echo ""

# GOOGLE_CLIENT_SECRET
echo "4️⃣  GOOGLE_CLIENT_SECRET"
read -p "   GOOGLE_CLIENT_SECRET: " GOOGLE_CLIENT_SECRET
echo ""

# Confirmar
echo "=============================================="
echo "📋 Resumo da Configuração:"
echo "DATABASE_URL: ${DATABASE_URL:0:30}..."
echo "BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET:0:20}..."
echo "GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:0:30}..."
echo "GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:0:20}..."
echo ""
read -p "Confirmar e salvar? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "❌ Cancelado"
    exit 1
fi

# Criar arquivo .env.local
cat > .env.local << EOF
# Database - Neon PostgreSQL
DATABASE_URL=$DATABASE_URL

# Better Auth Configuration
BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET

# Better Auth URL (local development)
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth Credentials
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET

# Next.js Public URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

echo ""
echo "✅ Arquivo .env.local criado com sucesso!"
echo ""
echo "🚀 Próximos passos:"
echo "   1. npx @better-auth/cli generate"
echo "   2. npm run db:push (ou npx @better-auth/cli migrate)"
echo "   3. npm run dev"







