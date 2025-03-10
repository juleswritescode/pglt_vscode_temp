import { FileType, Uri, workspace, WorkspaceFolder } from "vscode";
import { logger } from "./logger";
import { state } from "./state";
import { CONSTANTS, OperatingMode } from "./constants";
import { Utils } from "vscode-uri";
import { Project, ProjectDefinition } from "./project";
import { accessSync, constants } from "node:fs";

export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delay = 300
) {
  let timeout: NodeJS.Timeout | undefined;
  return (...args: TArgs) => {
    clearTimeout(timeout);
    setTimeout(() => fn(...args), delay);
  };
}

export async function fileExists(uri: Uri): Promise<boolean> {
  try {
    const result = await workspace.fs.stat(uri);

    /** the file can also be a symlink, hence the bitwise operation */
    return (result.type & FileType.File) > 0;
  } catch (err: unknown) {
    logger.debug(`Error verifying if file exists, uri: ${uri}, err: ${err}`);
    return false;
  }
}

export async function dirExists(uri: Uri): Promise<boolean> {
  try {
    const result = await workspace.fs.stat(uri);

    /** the file can also be a symlink, hence the bitwise operation */
    return (result.type & FileType.Directory) > 0;
  } catch (err: unknown) {
    logger.debug(`Error verifying if dir exists, uri: ${uri}, err: ${err}`);
    return false;
  }
}

/**
 * This function clears any temporary binaries that may have been created by
 * the extension. It deletes the `CONSTANTS.globalStorageFolderTmp` directory within the global storage
 * directory.
 */
export async function clearTemporaryBinaries() {
  logger.debug("Clearing temporary binaries");

  const binDirPath = Uri.joinPath(
    state.context.globalStorageUri,
    CONSTANTS.globalStorageFolderTmp
  );

  if (await dirExists(binDirPath)) {
    workspace.fs.delete(binDirPath, {
      recursive: true,
    });
    logger.debug("Cleared temporary binaries.", {
      path: binDirPath.fsPath,
    });
  }
}

export async function asyncFilter<T>(
  items: T[],
  predicate: (item: T) => Promise<boolean>
): Promise<T[]> {
  const results = await Promise.all(items.map(predicate));
  return items.filter((_, index) => results[index]);
}

export function getWorkspaceFolderByName(
  name: string
): WorkspaceFolder | undefined {
  return workspace.workspaceFolders?.find((folder) => folder.name === name);
}

export function getPathRelativeToWorkspaceFolder(
  folder: WorkspaceFolder,
  path?: string
): Uri {
  return Uri.parse(Utils.joinPath(folder.uri, path ?? "").fsPath);
}

/**
 * Determines if the extension is running in single-file mode
 */
export function runningInSingleFileMode(): boolean {
  return workspace.workspaceFolders === undefined;
}

/**
 * Generates a short URI for display purposes
 *
 * This function generates a short URI for display purposes. It takes into
 * account the operating mode of the extension and the project folder name.
 *
 * This is primarily used for naming logging channels.
 *
 * @param project The project for which the short URI is generated
 *
 * @example "/hello-world" (in single-root mode)
 * @example "workspace-folder-1::/hello-world" (in multi-root mode)
 */
export function shortURI(project: Project | ProjectDefinition): string {
  if (!project.folder || !project.path) {
    return "";
  }

  const uri = subtractURI(project.path, project.folder.uri);
  if (!uri) {
    return "";
  }

  const prefix =
    CONSTANTS.operatingMode === OperatingMode.MultiRoot
      ? `${project.folder.name}::`
      : "";
  return `${prefix}${uri.fsPath}`;
}

/**
 * Substracts the second string from the first string
 */
export function subtractURI(original: Uri, subtract: Uri): Uri | undefined {
  const _original = original.fsPath;
  const _subtract = subtract.fsPath;

  let result = _original.replace(_subtract, "");

  result = result === "" ? "/" : result;

  return Uri.parse(result);
}

/**
 * Checks if a file is executable
 *
 * This function checks if a file is executable using Node's `accessSync` function.
 * It returns true if the file is executable, otherwise it returns false.
 *
 * This is used to ensure that downloaded PGLT binaries are executable.
 */
export function fileIsExecutable(uri: Uri): boolean {
  try {
    accessSync(uri.fsPath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
