import {
  type ConfigurationScope,
  type WorkspaceFolder,
  workspace,
} from "vscode";
import type { ProjectDefinition } from "./project";

/**
 * This function retrieves a setting from the workspace configuration.
 * Settings are looked up under the "pglt" prefix.
 *
 * @param key The key of the setting to retrieve
 */
export const config = <T>(
  key: string,
  options: {
    scope?: ConfigurationScope;
  } = {}
): T | undefined => {
  return workspace.getConfiguration("pglt", options.scope).get<T>(key);
};

/**
 * TODO: Can the "state.activeProject" also refer to a workspace, or just to a workspace-folder?
 */
export const isEnabledForFolder = (folder: WorkspaceFolder): boolean => {
  return !!config<boolean>("enabled", { scope: folder.uri });
};

/**
 * This function determines whether the extension is enabled globally. This is
 * useful to conditionally enable or disable functionality based on the extension's
 * configuration at the global/user level.
 */
export const isEnabledGlobally = (): boolean => {
  const inspect = workspace
    .getConfiguration("pglt")
    .inspect<boolean>("enabled");

  if (!inspect) {
    return false;
  }

  /** default is `true` */
  return inspect.globalValue ?? inspect.defaultValue!;
};
