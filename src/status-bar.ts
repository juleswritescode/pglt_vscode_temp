import { StatusBarAlignment, type StatusBarItem, window } from "vscode";
import { type State, state } from "./state";
import { isEnabledForFolder, isEnabledGlobally } from "./config";

export type StatusBar = {
  item: StatusBarItem;
};

const createStatusBar = (): StatusBar => {
  const item = window.createStatusBarItem(
    "pglt_vscode",
    StatusBarAlignment.Right,
    1
  );

  return { item };
};

export const updateStatusBar = () => {
  if (!state) {
    return;
  }

  const enabled = state.activeProject?.folder
    ? isEnabledForFolder(state.activeProject.folder)
    : isEnabledGlobally();

  if (!enabled || state.hidden) {
    statusBar.item.hide();
    return;
  }

  const icon = getStateIcon(state);
  const text = getStateText();
  const version = getLspVersion();
  const tooltip = getStateTooltip();

  statusBar.item.text = `${icon} ${text} ${version}`.trim();
  statusBar.item.tooltip = tooltip;
  statusBar.item.show();
};

const getLspVersion = () => {
  const session = state.activeProject
    ? state.sessions.get(state.activeProject)
    : state.globalSession;
  return session?.client.initializeResult?.serverInfo?.version ?? "";
};

const getStateText = (): string => {
  return "PGLT";
};

const getStateTooltip = (): string => {
  switch (state.state) {
    case "initializing":
      return "Initializing";
    case "starting":
      return "Starting";
    case "restarting":
      return "Restarting";
    case "started":
      return "Up and running";
    case "stopping":
      return "Stopping";
    case "stopped":
      return "Stopped";
    case "error":
      return "Error";
  }
};

const getStateIcon = (state: State): string => {
  switch (state.state) {
    case "initializing":
      return "$(sync~spin)";
    case "starting":
      return "$(sync~spin)";
    case "restarting":
      return "$(sync~spin)";
    case "started":
      return "$(check)";
    case "stopping":
      return "$(sync~spin)";
    case "stopped":
      return "$(x)";
    case "error":
      return "$(error)";
    default:
      return "$(question)";
  }
};

export const statusBar = createStatusBar();
