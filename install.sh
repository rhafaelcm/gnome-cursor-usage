#!/usr/bin/env bash
set -euo pipefail

UUID="gnome-cursor-usage@rhafaelcm.github.io"
SRC="$(cd "$(dirname "$0")" && pwd)"
DEST="${HOME}/.local/share/gnome-shell/extensions/${UUID}"

pack() {
  if ! command -v gnome-extensions >/dev/null 2>&1; then
    echo "gnome-extensions is not installed." >&2
    exit 1
  fi
  (
    cd "$SRC"
    glib-compile-schemas schemas
    gnome-extensions pack \
      --force \
      --out-dir="$SRC" \
      --extra-source=indicator.js \
      --extra-source=popup.js \
      --extra-source=lib \
      --extra-source=icons \
      --extra-source=LICENSE \
      --extra-source=README.md
  )
  echo "Created ${SRC}/${UUID}.shell-extension.zip"
}

install_local() {
  mkdir -p "$DEST"
  rm -rf "${DEST:?}/"*
  cp -a "$SRC/metadata.json" "$DEST/"
  cp -a "$SRC/extension.js" "$DEST/"
  cp -a "$SRC/prefs.js" "$DEST/"
  cp -a "$SRC/indicator.js" "$DEST/"
  cp -a "$SRC/popup.js" "$DEST/"
  cp -a "$SRC/stylesheet.css" "$DEST/"
  cp -a "$SRC/LICENSE" "$DEST/"
  cp -a "$SRC/README.md" "$DEST/"
  cp -a "$SRC/lib" "$DEST/"
  cp -a "$SRC/icons" "$DEST/"
  cp -a "$SRC/schemas" "$DEST/"
  glib-compile-schemas "$DEST/schemas"
  echo "Installed to $DEST"
  echo
  echo "On Wayland, log out and back in, then enable the extension:"
  echo "  gnome-extensions enable $UUID"
  echo
  echo "Open preferences with:"
  echo "  gnome-extensions prefs $UUID"
}

case "${1:-install}" in
  pack)
    pack
    ;;
  install|"")
    install_local
    ;;
  *)
    echo "Usage: $0 [install|pack]" >&2
    exit 1
    ;;
esac
