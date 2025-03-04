import { RelativePattern, Uri, workspace } from "vscode";
import {
  BinaryFindStrategy,
  downloadBiomeStrategy,
  nodeModulesStrategy,
  pathEnvironmentVariableStrategy,
  vsCodeSettingsStrategy,
  yarnPnpStrategy,
} from "./binary-finder-strategies";
import { logger } from "./logger";
import { workerData } from "worker_threads";

type Strategy = {
  strategy: BinaryFindStrategy;
  onSuccess: (u: Uri) => void;
  condition?: (path?: Uri) => Promise<boolean>;
};

const GLOBAL_STRATEGIES: Strategy[] = [
  {
    strategy: vsCodeSettingsStrategy,
    onSuccess: (uri) =>
      logger.debug(`Found Binary in VSCode Settings (pglt.lsp.bin)`, {
        path: uri.fsPath,
      }),
  },
  {
    strategy: pathEnvironmentVariableStrategy,
    onSuccess: (uri) =>
      logger.debug(`Found Binary in PATH Environment Variable`, {
        path: uri.fsPath,
      }),
  },
  {
    strategy: downloadBiomeStrategy,
    onSuccess: (uri) =>
      logger.debug(`Found downloaded binary`, {
        path: uri.fsPath,
      }),
  },
];

const LOCAL_STRATEGIES: Strategy[] = [
  {
    strategy: vsCodeSettingsStrategy,
    onSuccess: (uri) =>
      logger.debug(`Found Binary in VSCode Settings (pglt.lsp.bin)`, {
        path: uri.fsPath,
      }),
  },
  {
    strategy: nodeModulesStrategy,
    onSuccess: (uri) =>
      logger.debug(`Found Binary in Node Modules`, {
        path: uri.fsPath,
      }),
  },
  {
    strategy: yarnPnpStrategy,
    onSuccess: (uri) =>
      logger.debug(`Found Binary in Yarn PnP`, {
        path: uri.fsPath,
      }),
  },
  {
    strategy: pathEnvironmentVariableStrategy,
    onSuccess: (uri) =>
      logger.debug(`Found Binary in PATH Environment Variable`, {
        path: uri.fsPath,
      }),
  },
  {
    strategy: downloadBiomeStrategy,
    onSuccess: (uri) =>
      logger.debug(`Found downloaded binary`, {
        path: uri.fsPath,
      }),

    /**
     * We don't want to encourage users downloading the binary if they
     * could also install it via `npm` (or other Node package managers).
     */
    condition: async (path) =>
      !path || // `path` should never be falsy in a local strategy
      workspace
        .findFiles(new RelativePattern(path, "**/package.json"))
        .then((rs) => rs.length === 0),
  },
];

export class BinaryFinder {
  static async findGlobally() {
    const binary = await this.attemptFind(GLOBAL_STRATEGIES);

    if (!binary) {
      logger.debug("Unable to find binary globally.");
    }

    return binary;
  }

  static async findLocally(path: Uri) {
    const binary = await this.attemptFind(LOCAL_STRATEGIES, path);

    if (!binary) {
      logger.debug("Unable to find binary locally.");
    }

    return binary;
  }

  private static async attemptFind(strategies: Strategy[], path?: Uri) {
    for (const { strategy, onSuccess, condition } of strategies) {
      if (condition && !(await condition(path))) {
        continue;
      }

      const binary = await strategy.find();
      if (binary) {
        onSuccess(binary);
        return { bin: binary };
      }
    }
  }
}
