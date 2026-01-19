import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";

// Type definitions (minimal, to avoid requiring @opencode-ai/plugin as hard dependency)
interface PluginContext {
  client: any;
  project: any;
  worktree: string;
  directory: string;
  serverUrl?: string;
  $: any;
}

interface PluginHooks {
  event?: (input: { event: any }) => Promise<void> | void;
  "server.connected"?: () => Promise<void> | void;
}

type Plugin = (ctx: PluginContext) => Promise<PluginHooks>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Environment variable toggles
const ENV = {
  MCP_ENABLE: process.env.OPENCODE_PW_MCP_ENABLE === "1",
  MCP_OVERWRITE: process.env.OPENCODE_PW_MCP_OVERWRITE === "1",
  AGENTS_OVERWRITE: process.env.OPENCODE_PW_AGENTS_OVERWRITE === "1",
};

// Path resolution
function getConfigDir(): string {
  return process.env.OPENCODE_CONFIG_DIR || join(homedir(), ".config", "opencode");
}

function getArtifactsDir(): string {
  return join(homedir(), ".cache", "opencode", "playwright");
}

function getPaths() {
  const configDir = getConfigDir();
  return {
    configDir,
    agentsDir: join(configDir, "agents"),
    configFile: join(configDir, "opencode.json"),
    artifactsDir: getArtifactsDir(),
    templatesDir: join(__dirname, "..", "src", "templates"), // Point to source templates
  };
}

// Ensure directory exists
function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

// Install agent file (idempotent)
function installAgentFile(agentsDir: string, templatesDir: string, filename: string, overwrite: boolean) {
  const targetPath = join(agentsDir, filename);
  const templatePath = join(templatesDir, filename);

  if (existsSync(targetPath) && !overwrite) {
    console.log(`[opencode-playwright-test-agents] Agent file already exists, skipping: ${filename}`);
    return false;
  }

  if (!existsSync(templatePath)) {
    console.error(`[opencode-playwright-test-agents] Template not found: ${templatePath}`);
    return false;
  }

  const templateContent = readFileSync(templatePath, "utf-8");
  writeFileSync(targetPath, templateContent, "utf-8");
  console.log(`[opencode-playwright-test-agents] ${overwrite ? "Updated" : "Created"} agent file: ${filename}`);
  return true;
}

// Merge MCP config (idempotent, no destructive overwrite)
function mergeMCPConfig(configFile: string, artifactsDir: string, enable: boolean, overwrite: boolean) {
  let config: any = {};
  let configExists = false;

  if (existsSync(configFile)) {
    try {
      const content = readFileSync(configFile, "utf-8");
      config = JSON.parse(content);
      configExists = true;
    } catch (err) {
      console.error(`[opencode-playwright-test-agents] Failed to parse ${configFile}:`, err);
      return false;
    }
  }

  if (!config.mcp) {
    config.mcp = {};
  }

  let modified = false;

  // Helper to add MCP server config
  const addMCPServer = (key: string, headlessFlag: boolean) => {
    if (config.mcp[key] && !overwrite) {
      console.log(`[opencode-playwright-test-agents] MCP config already exists, skipping: ${key}`);
      return false;
    }

    const command = [
      "npx",
      "@playwright/mcp@latest",
      ...(headlessFlag ? ["--headless"] : []),
      "--output-dir",
      artifactsDir,
      "--save-trace",
      "--save-session",
    ];

    config.mcp[key] = {
      type: "local",
      command,
      enabled: enable,
    };

    console.log(`[opencode-playwright-test-agents] ${overwrite ? "Updated" : "Added"} MCP config: ${key} (enabled=${enable})`);
    return true;
  };

  if (addMCPServer("playwright", false)) modified = true;
  if (addMCPServer("playwright_headless", true)) modified = true;

  if (modified) {
    try {
      writeFileSync(configFile, JSON.stringify(config, null, 2), "utf-8");
      console.log(`[opencode-playwright-test-agents] Updated config file: ${configFile}`);
      return true;
    } catch (err) {
      console.error(`[opencode-playwright-test-agents] Failed to write ${configFile}:`, err);
      return false;
    }
  }

  return false;
}

// Main installation logic (idempotent)
async function install() {
  console.log("[opencode-playwright-test-agents] Starting installation...");

  const paths = getPaths();

  // Ensure directories exist
  ensureDir(paths.agentsDir);
  ensureDir(paths.artifactsDir);

  // Install agent files
  const agentsInstalled = [
    installAgentFile(paths.agentsDir, paths.templatesDir, "playwright-verify.md", ENV.AGENTS_OVERWRITE),
    installAgentFile(paths.agentsDir, paths.templatesDir, "playwright-generate.md", ENV.AGENTS_OVERWRITE),
  ];

  // Merge MCP config
  const mcpConfigMerged = mergeMCPConfig(paths.configFile, paths.artifactsDir, ENV.MCP_ENABLE, ENV.MCP_OVERWRITE);

  // Summary
  console.log("[opencode-playwright-test-agents] Installation summary:");
  console.log(`  - Agents directory: ${paths.agentsDir}`);
  console.log(`  - Config file: ${paths.configFile}`);
  console.log(`  - Artifacts directory: ${paths.artifactsDir}`);
  console.log(`  - Agents installed/updated: ${agentsInstalled.filter(Boolean).length}`);
  console.log(`  - MCP config merged: ${mcpConfigMerged}`);

  if (!ENV.MCP_ENABLE) {
    console.log("");
    console.log("[opencode-playwright-test-agents] NOTE: Playwright MCP servers are DISABLED by default.");
    console.log("To enable, either:");
    console.log("  1. Set enabled: true in ~/.config/opencode/opencode.json for mcp.playwright and mcp.playwright_headless");
    console.log("  2. Restart OpenCode with: OPENCODE_PW_MCP_ENABLE=1 opencode");
  }

  console.log("[opencode-playwright-test-agents] Installation complete.");
}

// Plugin export
export const PlaywrightTestAgents: Plugin = async (ctx: PluginContext) => {
  let installed = false;

  return {
    "server.connected": async () => {
      if (installed) return;
      installed = true;
      await install();
    },
  };
};

// Default export for compatibility
export default PlaywrightTestAgents;
