#!/bin/sh
# Writes runtime config for the SPA from environment variables (public values only, never secrets).
set -eu
cat > /usr/share/nginx/html/config.js <<JS
window.__CONFIG__ = {
  oidcAuthority: "${OIDC_AUTHORITY:-http://localhost:8081/realms/interview-copilot}",
  oidcClientId: "${OIDC_CLIENT_ID:-interview-copilot-spa}",
  apiUrl: ""
}
JS
