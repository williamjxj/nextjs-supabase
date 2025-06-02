# 🤖 Using Context7 with Next.js Supabase Gallery

## 🤔 What is Context7?

Context7 is a Model Context Protocol (MCP) server that provides up-to-date documentation for LLMs and AI code editors. It helps provide better context and code assistance when working with modern frameworks and libraries.

## ⚙️ Setup

Context7 MCP is already configured in this project:

- See `.vscode/mcp.json` for the configuration
- The MCP server is installed globally: `@upstash/context7-mcp@latest`

## 📚 How to Use Context7

When working with your AI assistant (like GitHub Copilot or other AI tools), you can now reference Context7 to get better documentation and code examples:

### 💡 Example Prompts

1. **For Next.js App Router:**

   ```
   Create a new page component for the gallery using Next.js 15 app router. use @context7
   ```

2. **For Supabase Integration:**

   ```
   Show me how to implement real-time subscriptions with Supabase in Next.js. use @context7
   ```

3. **For Tailwind CSS:**

   ```
   Create responsive card components using Tailwind CSS v4. use @context7
   ```

4. **For TypeScript:**
   ```
   Define proper TypeScript interfaces for image upload functionality. use @context7
   ```

## 🔧 Configuration Details

The Context7 MCP server is configured in `.vscode/mcp.json`:

```json
{
  "servers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

## 🌐 Environment Variables

You can customize Context7 behavior with environment variables:

```json
{
  "servers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"],
      "env": {
        "DEFAULT_MINIMUM_TOKENS": "10000"
      }
    }
  }
}
```

## 🎯 Benefits for This Project

With Context7 integrated, you get:

1. **Up-to-date Next.js documentation** - Latest App Router patterns
2. **Current Supabase API references** - Latest features and best practices
3. **Modern Tailwind CSS examples** - Including v4 features
4. **TypeScript best practices** - Current type definitions and patterns
5. **React 19 features** - Latest hooks and patterns

## 🧪 Testing Context7

To test if Context7 is working:

```bash
npx -y @modelcontextprotocol/inspector npx @upstash/context7-mcp@latest
```

This will open an inspector to verify the MCP server is functioning correctly.

## 🔧 Troubleshooting

If you encounter issues:

1. **Module not found errors:** Try using `bunx` instead of `npx`
2. **ESM resolution issues:** Add `--experimental-vm-modules` flag
3. **Windows users:** Use `cmd /c npx` format

## Next Steps

Now that Context7 is set up, you can enhance your development workflow by:

1. Asking for context-aware code suggestions
2. Getting up-to-date documentation for your tech stack
3. Receiving better code completions and examples
4. Understanding modern patterns and best practices

Remember to prefix your prompts with "use @context7" or "use context7" to leverage the enhanced documentation.
