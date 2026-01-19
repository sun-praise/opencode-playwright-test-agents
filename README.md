# opencode-playwright-test-agents

OpenCode plugin that provides two specialized Playwright MCP test agents for end-to-end browser testing and test code generation.

## Features

- **Two Global Subagents**:
  - `@playwright-verify`: Browser-based E2E verification (headed-first with headless fallback). Produces structured test reports with screenshots and traces.
  - `@playwright-generate`: Generate TypeScript Playwright Test files from validated user flows.

- **Automatic Setup**: Installs agent definitions and Playwright MCP configuration on first run
- **Headed/Headless Fallback**: Automatically retries with headless mode if headed browser fails
- **Artifacts Collection**: Screenshots and traces saved to `~/.cache/opencode/playwright/`
- **Safe Defaults**: MCP servers disabled by default; user must explicitly enable

## Installation

### From Local Directory (Development)

```bash
# Clone or download this repo
git clone https://github.com/svtter/opencode-playwright-test-agents.git
cd opencode-playwright-test-agents

# Build the plugin
bun install
bun run build

# Add to your OpenCode config
# Edit ~/.config/opencode/opencode.json and add:
{
  "plugin": [
    "file:///absolute/path/to/opencode-playwright-test-agents/dist/index.js"
  ]
}
```

### From npm (Future)

```bash
# Will be available after publishing to npm
{
  "plugin": ["opencode-playwright-test-agents"]
}
```

## First-Time Setup

After installing the plugin and restarting OpenCode, the plugin will:

1. Create two agent files:
   - `~/.config/opencode/agents/playwright-verify.md`
   - `~/.config/opencode/agents/playwright-generate.md`

2. Add Playwright MCP configuration to `~/.config/opencode/opencode.json`:
   - `mcp.playwright` (headed mode)
   - `mcp.playwright_headless` (headless fallback)
   - **Both default to `enabled: false`**

3. Create artifacts directory: `~/.cache/opencode/playwright/`

## Enabling Playwright MCP

The plugin installs MCP configuration but **does not enable it by default**. To enable:

### Option 1: Manual Configuration

Edit `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "playwright": {
      "enabled": true
    },
    "playwright_headless": {
      "enabled": true
    }
  }
}
```

### Option 2: Environment Variable

```bash
OPENCODE_PW_MCP_ENABLE=1 opencode
```

## Usage

### Verification Only (No Code Generation)

```bash
@playwright-verify 测试 https://example.com 的登录流程：
1. 填写邮箱
2. 设置密码
3. 点击登录
验收点：成功跳转到欢迎页面
```

Output: Structured report with:
- Test steps & assertions (PASS/FAIL)
- Screenshots: `~/.cache/opencode/playwright/*.png`
- Trace: `~/.cache/opencode/playwright/trace.zip`

### Generate TypeScript Test Code

```bash
@playwright-generate 把刚才验证通过的登录流程生成成 @playwright/test 的 TS 回归用例
```

Output: TypeScript test file draft (waits for your confirmation before writing)

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCODE_PW_MCP_ENABLE` | `false` | Enable Playwright MCP servers on startup |
| `OPENCODE_PW_MCP_OVERWRITE` | `false` | Overwrite existing MCP config |
| `OPENCODE_PW_AGENTS_OVERWRITE` | `false` | Overwrite existing agent files |

## Security & Privacy

⚠️ **Important**: Playwright traces and screenshots may contain sensitive information (passwords, tokens, personal data).

**Recommendations**:
- Use test accounts, not production credentials
- Use `--storage-state` for authentication instead of hardcoding passwords
- Regularly clean `~/.cache/opencode/playwright/` artifacts
- Do not commit trace/screenshot files to version control

## Directory Structure

```
~/.config/opencode/
├── agents/
│   ├── playwright-verify.md       # Verification agent
│   └── playwright-generate.md     # Code generation agent
└── opencode.json                   # MCP config added here

~/.cache/opencode/playwright/       # Artifacts output
├── *.png                           # Screenshots
├── trace.zip                       # Playwright trace
└── *.session.json                  # Session data
```

## Uninstallation

1. Remove plugin from `~/.config/opencode/opencode.json`:
   ```json
   {
     "plugin": []  // Remove the plugin entry
   }
   ```

2. (Optional) Remove agent files:
   ```bash
   rm ~/.config/opencode/agents/playwright-*.md
   ```

3. (Optional) Clean artifacts:
   ```bash
   rm -rf ~/.cache/opencode/playwright/
   ```

## Troubleshooting

### MCP servers not starting

**Symptom**: `@playwright-verify` not available in autocomplete

**Solution**: Check MCP is enabled:
```bash
# In ~/.config/opencode/opencode.json
"mcp": {
  "playwright": { "enabled": true }
}
```

### Headed browser fails to launch

**Symptom**: Error about display/sandbox

**Solution**: The agent automatically retries with headless mode. Check logs for fallback confirmation.

### Artifacts directory permission denied

**Symptom**: Cannot write to `~/.cache/opencode/playwright/`

**Solution**:
```bash
mkdir -p ~/.cache/opencode/playwright
chmod 755 ~/.cache/opencode/playwright
```

## Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Credits

Built with:
- [OpenCode](https://opencode.ai) - AI coding agent platform
- [Playwright MCP](https://github.com/microsoft/playwright-mcp) - Official Playwright MCP server
- [@playwright/test](https://playwright.dev) - End-to-end testing framework

## Links

- [GitHub Repository](https://github.com/svtter/opencode-playwright-test-agents)
- [OpenCode Plugin Documentation](https://opencode.ai/docs/plugins)
- [Playwright MCP Documentation](https://playwright.dev/docs/mcp)
