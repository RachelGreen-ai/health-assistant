import 'dotenv/config';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
async function main() {
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('[epic-fhir-mcp] Server running on stdio. Ready for connections.');
    process.on('SIGINT', () => { server.close(); process.exit(0); });
    process.on('SIGTERM', () => { server.close(); process.exit(0); });
}
main().catch(err => {
    console.error('[epic-fhir-mcp] Fatal startup error:', err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map