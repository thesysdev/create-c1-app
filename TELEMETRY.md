# Telemetry in create-c1-app

## Overview

create-c1-app collects anonymous telemetry data to help us improve the tool and understand how it's being used. All data collection is completely anonymous and no personally identifiable information is collected.

## What Data is Collected

We collect the following anonymous information:

### Device Information
- Operating system type and version
- Node.js version
- System architecture (e.g., x64, arm64)
- Platform (e.g., darwin, linux, win32)
- Package version of create-c1-app


### What We DON'T Collect
- No API keys or sensitive credentials (automatically stripped from error messages)
- No file contents or project source code
- No personally identifiable information
- No actual file paths (anonymized in error messages)
- No user names or email addresses (stripped from error messages)
- No detailed stack traces with sensitive information

## How to Control Telemetry

### Disable Telemetry

You can disable telemetry by:

```bash
npx create-c1-app --disable-telemetry
```

### View Collected Telemetry

To see what telemetry data is being collected before it's sent, you can enable debug mode:

```bash
npx create-c1-app --debug
```

This will display the telemetry data in the console, allowing you to see exactly what information would be transmitted.


## Why We Collect Telemetry

Anonymous telemetry helps us:

1. **Understand Usage Patterns**: See which features are used most and where users encounter issues
2. **Improve Reliability**: Identify common error scenarios and fix them
3. **Prioritize Development**: Focus on the most impactful improvements
4. **Support Different Environments**: Ensure compatibility across different operating systems and Node.js versions

## Transparency

- This documentation explains exactly what data is collected
- The telemetry implementation is open source and can be reviewed
- You have complete control over whether telemetry is enabled
- Telemetry can be disabled at any time without affecting functionality

## Questions or Concerns

If you have any questions about telemetry or privacy, please open an issue on our GitHub repository.
