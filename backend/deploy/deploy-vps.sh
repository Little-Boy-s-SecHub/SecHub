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
reload_systemd=false

if grep -q '/opt/SecHub/backend/target/sechub-backend-1.0.0.jar' "$unit_file"; then
  cp -a "$unit_file" "$unit_file.pre-release-link"
  sed -i 's#/opt/SecHub/backend/target/sechub-backend-1.0.0.jar#/opt/sechub/current.jar#' "$unit_file"
  reload_systemd=true
fi

drop_in_source="$repo_dir/backend/deploy/sechub-backend.service.d/10-graceful-exit.conf"
drop_in_dir="/etc/systemd/system/$service_name.service.d"
drop_in_file="$drop_in_dir/10-graceful-exit.conf"
install -d -m 755 "$drop_in_dir"
if ! cmp --silent "$drop_in_source" "$drop_in_file"; then
  install -m 644 "$drop_in_source" "$drop_in_file"
  reload_systemd=true
fi

if [[ "$reload_systemd" == true ]]; then
  systemctl daemon-reload
fi

systemctl restart "$service_name"
health_url="${SECHUB_HEALTH_URL:-http://127.0.0.1:8888/actuator/health}"
health_body="No health response received"

for attempt in {1..60}; do
  if health_body="$(curl --noproxy '*' --fail --silent --show-error --max-time 5 "$health_url" 2>&1)" \
      && grep -q '"status":"UP"' <<<"$health_body"; then
    systemctl --no-pager --full status "$service_name" | sed -n '1,12p' || true
    exit 0
  fi
  sleep 2
done

echo "Backend did not become healthy at $health_url"
echo "Last health response: $health_body"
journalctl -u "$service_name" -n 80 --no-pager
exit 1
