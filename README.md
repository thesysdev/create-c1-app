# Create C1 App 

A powerful CLI tool that setups Generative UI examples with C1 by Thesys

## Features

✨ **Interactive Project Setup**




## Quick Start

```bash
# Run the tool
npx create-c1-app

# With project name
npx create-c1-app my-thesys-project

# With project name and options
npx create-c1-app my-thesys-project --template template-c1-component-next --api-key your-api-key
```

## CLI Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `[project-name]` | | Name of the project to create (positional argument) | Interactive prompt |
| `--project-name` | `-n` | Name of the project to create (alternative to positional argument) | Interactive prompt |
| `--template` | `-t` | Next.js template to use (`template-c1-component-next` or `template-c1-next`) | Interactive prompt |
| `--api-key` | `-k` | Thesys API key to use for the project | Interactive prompt |
| `--auth` | | Authentication method (`oauth`, `manual`, `skip`) | Prompt in interactive mode; `oauth` when provided |
| `--skip-auth` | | **Deprecated**. Use `--auth skip` instead | `false` |
| `--debug` | `-d` | Enable debug logging | `false` |
| `--non-interactive` | | Run without prompts; fails fast if required options are missing. Auto-enabled in non-TTY shells. | `false` (auto-detected) |
| `--disable-telemetry` | | Disable anonymous telemetry for current session | `false` |

## Usage Examples

### Basic Usage

```bash
# Interactive mode with OAuth authentication (recommended)
npx create-c1-app

# Quick setup with project name as positional argument
npx create-c1-app my-thesys-project

# Quick setup with project name, template, and API key
npx create-c1-app my-thesys-component --template template-c1-component-next --api-key your-api-key-here

# Using flag instead of positional argument
npx create-c1-app --project-name my-thesys-component --template template-c1-component-next --api-key your-api-key-here

# With specific template choice
npx create-c1-app my-project --template template-c1-next --api-key your-api-key-here

# Interactive with API key provided
npx create-c1-app --api-key your-api-key-here
```


## Development

### Building from Source

```bash
git clone https://github.com/thesysdev/create-c1-app.git
cd create-c1-app
pnpm install
pnpm run build
pnpm link
```


## Authentication Options

Create C1 App supports flexible authentication methods:

### Option 1: OAuth 2.0 Authentication (Recommended)

The CLI will automatically open your browser and guide you through the OAuth authentication process. This is the default in interactive mode.

```bash
npx create-c1-app
# or explicitly:
npx create-c1-app --auth oauth
```

This method will:
- Open your browser for secure authentication
- Generate an API key automatically after successful login
- Store the API key in your project's `.env` file

If you do not pass an auth option in interactive mode, the CLI will ask you to choose between OAuth, manual API key entry, or skip.

### Option 2: Manual API Key

If you prefer to enter your API key manually:

```bash
npx create-c1-app --auth manual
```

Or provide your existing API key directly via flag:

```bash
npx create-c1-app --api-key your-api-key-here
```

### Option 3: Skip Authentication

To skip authentication and API key generation (useful for testing or CI where you might set the key later):

```bash
npx create-c1-app --auth skip
```

*Note: The `--skip-auth` flag is deprecated but still supported for backward compatibility. Use `--auth skip` going forward.*

## Getting Your Thesys API Key (Manual Method)

To get an API key manually:

1. 🌐 Visit: https://console.thesys.dev/keys
2. 🔐 Sign in to your Thesys account
3. 🆕 Click "Create New API Key"
4. 📝 Give your key a descriptive name
5. 📋 Copy the generated API key

💡 **Tip**: Keep your API key secure and never share it publicly!

## Troubleshooting

### Common Issues

**Error: "Project directory already exists"**
```bash
# Choose a different name or remove the existing directory
rm -rf existing-project-name
npx create-c1-app
```

**Error: "Failed to download template"**
```bash
# Check your internet connection and try again
npx create-c1-app
```

**Error: "Failed to install dependencies"**
```bash
# Navigate to your project and install manually
cd your-project-name
npm install
```

### Debug Mode

Enable debug logging for detailed troubleshooting:

```bash
npx create-c1-app --debug
```

Or set the environment variable:

```bash
export CREATE_C1_APP_DEBUG=true
npx create-c1-app
```

## Telemetry

create-c1-app collects anonymous telemetry data to help improve the tool. No personally identifiable information is collected.

### Managing Telemetry

```bash
# Disable for current session
npx create-c1-app --disable-telemetry

# Disable via environment variable
export CREATE_C1_APP_DISABLE_TELEMETRY=true
```

For complete details about what data is collected and how to control it, see [TELEMETRY.md](./TELEMETRY.md).

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 🐛 [Issues](https://github.com/thesysdev/create-c1-app/issues)
- 💬 [Discussions](https://github.com/thesysdev/create-c1-app/discussions)

---

Made with ❤️ by Thesys
