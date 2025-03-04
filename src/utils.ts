import { FileType, Uri, workspace } from "vscode";
import { logger } from "./logger";

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
