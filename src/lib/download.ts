export const VERSION = "0.1.0";

export const REPO_URL = "https://github.com/max-lee-dev/local-lmcanvas";

export const ARM64_DMG_URL = `${REPO_URL}/releases/latest/download/local-lmcanvas-${VERSION}-arm64.dmg`;
export const INTEL_DMG_URL = `${REPO_URL}/releases/latest/download/local-lmcanvas-${VERSION}.dmg`;

/** Default download (Apple Silicon — ~90% of current Macs). */
export const DEFAULT_DMG_URL = ARM64_DMG_URL;
