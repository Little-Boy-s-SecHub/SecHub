#!/usr/bin/env bash
set -euo pipefail

repo_dir="${SECHUB_REPO_DIR:-/opt/SecHub}"
release_dir="${SECHUB_RELEASE_DIR:-/opt/sechub/releases}"
current_jar="${SECHUB_CURRENT_JAR:-/opt/sechub/current.jar}"
service_name="${SECHUB_SERVICE_NAME:-sechub-backend}"

cd "$repo_dir/backend"
mvn --batch-mode -DskipTests package

revision="$(git -C "$repo_dir" rev-parse --short=12 HEAD)"
release_jar="$release_dir/sechub-backend-$revision.jar"
install -d -m 755 "$release_dir"
install -m 644 target/sechub-backend-1.0.0.jar "$release_jar"

ln -sfn "$release_jar" "$current_jar.next"
mv -Tf "$current_jar.next" "$current_jar"

unit_file="/etc/systemd/system/$service_name.service"
if grep -q '/opt/SecHub/backend/target/sechub-backend-1.0.0.jar' "$unit_file"; then
  cp -a "$unit_file" "$unit_file.pre-release-link"
  sed -i 's#/opt/SecHub/backend/target/sechub-backend-1.0.0.jar#/opt/sechub/current.jar#' "$unit_file"
  systemctl daemon-reload
fi

systemctl restart "$service_name"
for attempt in {1..30}; do
  if curl --fail --silent http://127.0.0.1:8888/actuator/health | grep -q '"status":"UP"'; then
    systemctl --no-pager --full status "$service_name" | sed -n '1,12p'
    exit 0
  fi
  sleep 2
done

journalctl -u "$service_name" -n 80 --no-pager
exit 1
