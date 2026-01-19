#!/usr/bin/env node
import plugin from './dist/index.js';

console.log('Testing OpenCode Playwright Plugin Installation...\n');

// Simulate OpenCode MCP server
const mockServer = {
  connected: (handler) => {
    console.log('✓ Plugin registered for server.connected event');
    console.log('✓ Triggering installation handler...\n');
    return handler();
  }
};

// Load plugin (it's async)
const hooks = await plugin(mockServer);
console.log('\n✓ Plugin hooks registered:', Object.keys(hooks).join(', '));

// Manually trigger the handler
if (hooks['server.connected']) {
  console.log('\n✓ Triggering server.connected handler manually...');
  await hooks['server.connected']();
}

console.log('\n--- Installation Complete ---');
console.log('Check the following:');
console.log('1. Agents in ~/.config/opencode/agents/');
console.log('2. MCP config in ~/.config/opencode/opencode.json');
console.log('3. Artifacts directory ~/.cache/opencode/playwright/');
