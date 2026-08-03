#!/bin/bash

echo "==================================================================="
echo "Production Secrets Generator"
echo "==================================================================="
echo ""
echo "Copy these values to your .env.production file"
echo ""
echo "-------------------------------------------------------------------"
echo "PostgreSQL Password:"
openssl rand -base64 32
echo ""

echo "-------------------------------------------------------------------"
echo "Redis Password:"
openssl rand -base64 32
echo ""

echo "-------------------------------------------------------------------"
echo "MQTT Password:"
openssl rand -base64 32
echo ""

echo "-------------------------------------------------------------------"
echo "JWT Secret (64 chars):"
openssl rand -hex 64
echo ""

echo "-------------------------------------------------------------------"
echo "Refresh JWT Secret (64 chars):"
openssl rand -hex 64
echo ""

echo "==================================================================="
echo "IMPORTANT: Save these passwords in a secure password manager!"
echo "==================================================================="