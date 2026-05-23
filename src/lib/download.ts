export const VERSION = "0.2.6";

export const REPO_URL = "https://github.com/max-lee-dev/local-lmcanvas";

// Asset names must match `productName` in the app's package.json — see
// scripts/release.sh which derives `${PRODUCT_NAME}-${VERSION}.dmg`.
const ASSET_PREFIX = "LMCanvas";

export const ARM64_DMG_URL = `${REPO_URL}/releases/latest/download/${ASSET_PREFIX}-${VERSION}-arm64.dmg`;
export const INTEL_DMG_URL = `${REPO_URL}/releases/latest/download/${ASSET_PREFIX}-${VERSION}.dmg`;

/** Default download (Apple Silicon — ~90% of current Macs). */
export const DEFAULT_DMG_URL = ARM64_DMG_URL;
