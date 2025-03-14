# Simple Project

A bread-and-butter project with a `pglt.toml` on top level and SQL files in the `test` folder.
You should either let the `.vscode/settings.json` point to a binary OR add a folder containing the `pglt(.exe)` binary to your `PATH`.

## Expectations

The extension should recognize the `pglt.toml` file and connect with the right database. If the global binary is installed, it should not prompt for a local binary.

## Test protocol

TODO
