#!/bin/bash

# Source the .env file
set -a
source .env
set +a

# Ensure environment variables are set correctly
EDGE_RUNTIME_SUPABASE_URL="$EXPO_PUBLIC_SUPABASE_URL"
EDGE_RUNTIME_SUPABASE_ROLE_KEY="$EXPO_SUPABASE_SERVICE_ROLE_KEY"
OPENAI_API_KEY="$EXPO_PUBLIC_OPENAI_API_KEY"

# Deploy the AI agent edge function
echo "Deploying AI agent edge function..."
supabase functions deploy ai-agent --project-ref wtzfdnzklxlnsgerdegk

# Set the secrets for the edge function
echo "Setting environment variables..."
supabase secrets set --project-ref wtzfdnzklxlnsgerdegk \
  OPENAI_API_KEY="$OPENAI_API_KEY" \
  EDGE_RUNTIME_SUPABASE_URL="$EDGE_RUNTIME_SUPABASE_URL" \
  EDGE_RUNTIME_SUPABASE_ROLE_KEY="$EDGE_RUNTIME_SUPABASE_ROLE_KEY"

# Verify the secrets were set correctly
echo "Verifying environment variables..."
supabase secrets list --project-ref wtzfdnzklxlnsgerdegk 