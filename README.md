# Create C1 App 

A powerful CLI tool that setups Generative UI examples with C1 by Thesys

## Features

✨ **Interactive Project Setup**




## Quick Start

```bash
# Run the tool
npx create-c1-app

# Or with options
npx create-c1-app --project-name my-thesys-project --template template-c1-component-next --api-key your-api-key
```

## CLI Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--project-name` | `-n` | Name of the project to create | Interactive prompt |
| `--template` | `-t` | Next.js template to use (`template-c1-component-next` or `template-c1-next`) | Interactive prompt |
| `--api-key` | `-k` | Thesys API key to use for the project | Interactive prompt |
| `--debug` | `-d` | Enable debug logging | `false` |
| `--disable-telemetry` | | Disable anonymous telemetry for current session | `false` |

## Usage Examples

### Basic Usage

```bash
# Interactive mode (recommended)
npx create-c1-app

# Quick setup with project name, template, and API key
npx create-c1-app --project-name my-thesys-component --template template-c1-component-next --api-key your-api-key-here

# With specific template choice
npx create-c1-app --template template-c1-next --api-key your-api-key-here

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


## Getting Your Thesys API Key

To use Create C1 App, you'll need a Thesys API key:

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
