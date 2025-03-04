import { Uri } from "vscode";
import { logger } from "./logger";
import { delimiter, dirname, join } from "node:path";
import { CONSTANTS } from "./constants";
import { fileExists } from "./utils";
import { createRequire } from "node:module";

export interface BinaryFindStrategy {
  find(path?: Uri): Promise<Uri | null>;
}

export const vsCodeSettingsStrategy: BinaryFindStrategy = {
  async find(path?: Uri) {
    /**
     *
     */
    return null;
  },
};

/**
 * Task:
 * Search the binary in node modules.
 * Search for the sub-packages that the binary tries to use with npm.
 * Use node's `createRequire` – what's that?
 * Resolve the *main* package.json – the one used by @pglt/pglt.
 * In those node_modules, you should see the installed optional dependency.
 */
export const nodeModulesStrategy: BinaryFindStrategy = {
  async find(path: Uri) {
    logger.debug("Trying to find PGLT binary in Node Modules");

    if (!path) {
      logger.debug("No local path, skipping.");
      return null;
    }

    /**
     * Create a scoped require function that can require modules from the
     * package installed via npm.
     *
     * We're essentially searching for the installed package in the current dir, and requiring from its node_modules.
     * `package.json` serves as a target to resolve the root of the package.
     */
    const requirePgltPackage = createRequire(
      require.resolve(`${CONSTANTS.npmPackageName}/package.json`, {
        paths: [path.fsPath], // note: global ~/.node_modules is always searched
      })
    );

    const binPackage = dirname(
      requirePgltPackage.resolve(
        `${CONSTANTS.platformSpecificNodePackageName}/package.json`
      )
    );

    const pglt = Uri.file(join(binPackage, CONSTANTS.binaryName));

    if (await fileExists(pglt)) {
      return pglt;
    }

    return null;
  },
};

export const yarnPnpStrategy: BinaryFindStrategy = {
  async find(path?: Uri) {
    logger.debug("Trying to find PGLT binary in Yarn Plug'n'Play");

    if (!path) {
      logger.debug("No local path, skipping.");
      return null;
    }

    for (const ext of ["cjs", "js"]) {
      const pnpFile = Uri.joinPath(path, `.pnp.${ext}`);

      if (!(await fileExists(pnpFile))) {
        logger.debug(`Couldn't find Plug'n'Play file with ext '${ext}'`);
        continue;
      }

      /**
       * Load the pnp file, so we can use the exported
       * `resolveRequest` method.
       *
       * `resolveRequest(request, issuer)` takes a request for a dependency and an issuer
       * that depends on said dependency.
       */
      const yarnPnpApi = require(pnpFile.fsPath);

      /**
       * Issue a request to the PGLT package.json from the current dir.
       */
      const pgltPackage = yarnPnpApi.resolveRequest(
        `${CONSTANTS.npmPackageName}/package.json`,
        path.fsPath
      );

      if (!pgltPackage) {
        logger.debug("Unable to find PGLT package via Yarn Plug'n'Play API");
        continue;
      }

      /**
       * Return URI to the platform-specific binary that the found main package depends on.
       */
      return Uri.file(
        yarnPnpApi.resolveRequest(
          `${CONSTANTS.platformSpecificNodePackageName}/${CONSTANTS.binaryName}`,
          pgltPackage
        )
      );
    }

    logger.debug("Couldn't find PGLT binary via Yarn Plug'n'Play");

    return null;
  },
};

export const pathEnvironmentVariableStrategy: BinaryFindStrategy = {
  async find() {
    const pathEnv = process.env.PATH;

    logger.debug("Trying to find PGLT binary in PATH env var");

    if (!pathEnv) {
      logger.debug("Path env var not found");
      return null;
    }

    for (const dir of pathEnv.split(delimiter)) {
      const pglt = Uri.joinPath(Uri.file(dir), CONSTANTS.binaryName);

      if (await fileExists(pglt)) {
        return pglt;
      }
    }

    logger.debug("Couldn't determine binary in PATH env var");

    return null;
  },
};

export const downloadBiomeStrategy: BinaryFindStrategy = {
  async find(path?: Uri) {
    return null;
  },
};
