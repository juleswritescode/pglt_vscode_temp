import { workspace } from "vscode";

export enum OperatingMode {
  SingleFile = "single_file",
  SingleRoot = "single_root",
  MultiRoot = "multi_root",
}

/**
 * platform and arch are values injected into the node runtime.
 * We use the values documented on https://nodejs.org.
 */
const PACKAGE_NAMES: Record<string, Record<string, string>> = {
  win32: {
    x64: "pglt-x86_64-windows-msvc",
    arm64: "pglt-aarch64-windows-msvc",
  },
  darwin: {
    x64: "pglt-x86_64-apple-darwin",
    arm64: "pglt-aarch64-apple-darwin",
  },
  linux: {
    x64: "pglt-x86_64-linux-gnu",
    arm64: "pglt-aarch64-linux-gnu",
  },
};

const platformMappings: Record<string, string> = {
  darwin: "darwin",
  linux: "unknown-linux-gnu",
  win32: "pc-windows-msvc",
};

const archMappings: Record<string, string> = {
  arm64: "aarch64",
  x64: "x86_64",
};

const _CONSTANTS = {
  displayName: "pglt", // TODO: read from package.json

  activationTimestamp: Date.now(),

  binaryName: (() => {
    return `pglt${process.platform === "win32" ? ".exe" : ""}`;
  })(),

  /**
   * The name under which pglt is published on npm.
   */
  npmPackageName: "@pglt/pglt",

  platformSpecificNodePackageName: (() => {
    const platform: string = process.platform;
    const arch: string = process.arch;

    const pkg = PACKAGE_NAMES[platform]?.[arch];

    // TODO: what if we don't have an available package?
    return pkg;
  })(),

  releasedAssetName: (() => {
    let assetName = "pglt";

    for (const [nodePlatform, rustPlatform] of Object.entries(
      platformMappings
    )) {
      if (nodePlatform === process.platform) {
        assetName += `_${rustPlatform}`;
      }
    }

    for (const [nodeArch, rustArch] of Object.entries(archMappings)) {
      if (nodeArch === process.arch) {
        assetName += `-${rustArch}`;
      }
    }
  })(),

  currentMachineSupported: (() => {
    // In future release, we should also check whether the toolchain matches (Linux musl, GNU etc.)
    return !!(platformMappings[process.platform] && archMappings[process.arch]);
  })(),

  operatingMode: ((): OperatingMode => {
    if (workspace.workspaceFolders === undefined) {
      return OperatingMode.SingleFile;
    }

    if (workspace.workspaceFolders.length > 1) {
      return OperatingMode.MultiRoot;
    }

    return OperatingMode.SingleRoot;
  })(),
};

export const CONSTANTS: typeof _CONSTANTS = new Proxy(_CONSTANTS, {
  get(target, prop, receiver) {
    return Reflect.get(target, prop, receiver);
  },
  set: () => true,
  deleteProperty: () => true,
});
