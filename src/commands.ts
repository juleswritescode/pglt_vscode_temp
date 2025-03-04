import { downloadBiome } from "./downloader";
import { restart, start, stop } from "./lifecycle";
import { logger } from "./logger";
import { state } from "./state";
import { clearTemporaryBinaries } from "./utils";

/**
 * These commands are exposed to the user via the Command Palette.
 */
export class UserFacingCommands {
  static async start() {
    await start();
  }

  static async stop() {
    await stop();
  }

  static async restart() {
    await restart();
  }

  /**
   * When calling this command, the user will be prompted to select a version of
   * the PGLT CLI to install. The selected version will be downloaded and stored
   * in VS Code's global storage directory.
   */
  static async download() {
    await downloadBiome();
  }

  /**
   * Stops and restarts the PGLT extension, resetting state and cleaning up temporary binaries.
   */
  static async reset() {
    await stop();
    await clearTemporaryBinaries();
    await state.context.globalState.update("downloadedVersion", undefined);
    logger.info("Biome extension was reset");
    await start();
  }
}
