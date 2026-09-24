const express = require('express');
const { tavily } = require('@tavily/core');

const app = express();
app.use(express.json());

app.get('/', (req, res) => res.send('MCP Server is Live!'));

app.post('/mcp', async (req, res) => {
  const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
  const { method, params, id } = req.body;

  if (method === 'tools/list') {
    return res.json({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [{
          name: 'web_search',
          description: 'Search the web using Tavily API',
          inputSchema: {
            type: 'object',
            properties: { query: { type: 'string' } },
            required: ['query']
          }
        }]
      }
    });
  }

  if (method === 'tools/call') {
    try {
      const searchRes = await tvly.search(params.arguments.query, { maxResults: 5 });
      const text = searchRes.results.map(r => `${r.title}\n${r.url}\n${r.content}`).join('\n\n');
      return res.json({
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text }] }
      });
    } catch (err) {
      return res.json({ jsonrpc: '2.0', id, error: { code: -32603, message: err.message } });
    }
  }

  res.json({ jsonrpc: '2.0', id, error: { code: -32601, message: 'Method not found' } });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
