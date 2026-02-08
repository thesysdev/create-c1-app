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

| Option                | Alias | Description                                                                                            | Default                 |
| --------------------- | ----- | ------------------------------------------------------------------------------------------------------ | ----------------------- |
| `[project-name]`      |       | Name of the project to create (positional argument)                                                    | Interactive prompt      |
| `--project-name`      | `-n`  | Name of the project to create (alternative to positional argument)                                     | Interactive prompt      |
| `--template`          | `-t`  | Next.js template to use (`template-c1-component-next` or `template-c1-next`)                           | Interactive prompt      |
| `--api-key`           | `-k`  | Thesys API key to use for the project                                                                  | Interactive prompt      |
| `--debug`             | `-d`  | Enable debug logging                                                                                   | `false`                 |
| `--non-interactive`   |       | Run without prompts; fails fast if required options are missing. Auto-enabled in CI or non-TTY shells. | `false` (auto-detected) |
| `--disable-telemetry` |       | Disable anonymous telemetry for current session                                                        | `false`                 |

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

### Non-Interactive / CI / Agent Usage

When running in CI pipelines, automated scripts, or AI agent shells (e.g. Cursor, Copilot, Devin), interactive prompts will hang. The CLI supports a fully non-interactive mode:

```bash
# Explicit flag
npx create-c1-app my-project --template template-c1-next --api-key YOUR_API_KEY --non-interactive

# Or just provide all required flags — non-interactive mode is auto-detected
# when stdin is not a TTY (pipes, agents, CI) or when CI env vars are set
npx create-c1-app my-project --template template-c1-next --api-key YOUR_API_KEY
```

**Auto-detection:** The CLI automatically enables non-interactive mode when:

- `stdin` is not a TTY (piped input, background process, agent shell)

**Behavior in non-interactive mode:**

- `--api-key` is **required** (OAuth browser flow is skipped)
- `--project-name` defaults to `my-c1-app` if not provided
- `--template` defaults to `template-c1-next` if not provided
- The CLI will **fail immediately** with a clear error if required options are missing, instead of hanging on a prompt

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

Create C1 App supports two authentication methods:

### Option 1: OAuth 2.0 Authentication (Recommended)

The CLI will automatically open your browser and guide you through the OAuth authentication process:

```bash
npx create-c1-app
```

This method will:

- Open your browser for secure authentication
- Generate an API key automatically after successful login
- Store the API key in your project's `.env` file

### Option 2: Manual API Key

If you prefer to provide your API key manually or skip OAuth authentication:

```bash
npx create-c1-app --skip-auth
```

Or provide your existing API key directly:

```bash
npx create-c1-app --api-key your-api-key-here
```

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
