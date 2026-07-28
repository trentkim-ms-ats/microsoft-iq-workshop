#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./tools/github/commit_and_push.sh [repo-slug] [commit-subject] [commit-body]

Example:
  ./tools/github/commit_and_push.sh \
    trentkim/IQ-3-Workshop \
    "feat: Add complete 3-IQ workshop implementation" \
    "Organize the FabricIQ, WorkIQ, and FoundryIQ workshop."

Environment variables:
  REPO_VISIBILITY  Repository visibility when it must be created.
                   Supported values: private (default), public.
  REMOTE_NAME      Git remote name. Default: origin.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

REPO_SLUG="${1:-trentkim/IQ-3-Workshop}"
COMMIT_SUBJECT="${2:-chore: Update 3-IQ workshop content}"
COMMIT_BODY="${3:-Update workshop documentation, data, notebooks, and automation.}"
REPO_VISIBILITY="${REPO_VISIBILITY:-private}"
REMOTE_NAME="${REMOTE_NAME:-origin}"
REMOTE_URL="https://github.com/${REPO_SLUG}.git"

case "${REPO_VISIBILITY}" in
  private|public) ;;
  *)
    echo "REPO_VISIBILITY must be 'private' or 'public'." >&2
    exit 2
    ;;
esac

git rev-parse --show-toplevel >/dev/null

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required." >&2
  exit 1
fi

echo "== Recent commit convention =="
git --no-pager log --oneline -20
git --no-pager log --oneline --author="$(git config user.name)" -10

echo "== Current changes =="
git status --short

if ! gh auth status --hostname github.com >/dev/null 2>&1; then
  gh auth login --hostname github.com --git-protocol https --web
fi
gh auth setup-git

echo "== Stage and review =="
git add -A
git diff --cached --stat
git diff --cached --check || true

if ! git diff --cached --quiet; then
  git commit \
    -m "${COMMIT_SUBJECT}" \
    -m "${COMMIT_BODY}" \
    -m "Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"
else
  echo "No staged changes to commit."
fi

if git remote get-url "${REMOTE_NAME}" >/dev/null 2>&1; then
  CURRENT_REMOTE_URL="$(git remote get-url "${REMOTE_NAME}")"
  if [[ "${CURRENT_REMOTE_URL}" != "${REMOTE_URL}" ]]; then
    echo "Remote '${REMOTE_NAME}' points to '${CURRENT_REMOTE_URL}'." >&2
    echo "Expected '${REMOTE_URL}'. Update it explicitly before continuing." >&2
    exit 1
  fi
else
  git remote add "${REMOTE_NAME}" "${REMOTE_URL}"
fi

if ! gh repo view "${REPO_SLUG}" >/dev/null 2>&1; then
  gh repo create "${REPO_SLUG}" "--${REPO_VISIBILITY}"
fi

# GitHub rejects workflow changes unless the OAuth token has workflow scope.
if [[ -d ".github/workflows" ]]; then
  AUTH_STATUS="$(gh auth status --hostname github.com 2>&1 || true)"
  if [[ "${AUTH_STATUS}" != *"workflow"* ]]; then
    gh auth refresh --hostname github.com --scopes workflow
  fi
fi

if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
  UPSTREAM_REMOTE="$(git config --get "branch.$(git branch --show-current).remote")"
  git fetch "${UPSTREAM_REMOTE}"

  read -r AHEAD BEHIND < <(git rev-list --left-right --count HEAD...'@{u}')
  if (( BEHIND > 0 )); then
    git rebase '@{u}'
  fi
  if (( AHEAD > 0 || BEHIND > 0 )); then
    git push
  else
    echo "Branch is already synchronized."
  fi
else
  git push -u "${REMOTE_NAME}" HEAD
fi

echo "== Validation =="
git status --porcelain
git rev-list --left-right --count HEAD...'@{u}'
git rev-parse --abbrev-ref --symbolic-full-name '@{u}'
