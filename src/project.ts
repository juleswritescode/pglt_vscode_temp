import { Uri, type WorkspaceFolder, workspace } from "vscode";
import { fileExists } from "./utils";
import { getConfig } from "./config";
import { logger } from "./logger";

export type Project = {
  folder?: WorkspaceFolder;
  path: Uri;
  configPath: Uri;
};

export async function getActiveProject(): Promise<Project | null> {
  const folders = workspace.workspaceFolders;

  if (!folders?.length) {
    return null;
  }

  const first = folders[0];

  let configPath: Uri;
  const userConfig = getConfig<string>("configFile", { scope: first.uri });
  if (userConfig) {
    logger.info("User has specified path to config file.", {
      path: userConfig,
    });
    configPath = Uri.joinPath(first.uri, userConfig);
  } else {
    logger.info("User did not specify path to config file. Using default.");
    configPath = Uri.joinPath(first.uri, "pglt.toml");
  }

  if (!(await fileExists(configPath))) {
    logger.info("Config file does not exist.", {
      path: configPath.fsPath,
    });
    return null;
  } else {
    logger.info("Found config file.", {
      path: configPath.fsPath,
    });
  }

  return {
    folder: first,
    path: first.uri,
    configPath,
  };
}
