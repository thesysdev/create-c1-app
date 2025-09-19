# Create C1 App - NPM Package Specification

## Overview
A CLI tool that creates a Next.js project, authenticates users with an API service, generates API keys, and stores them using dotenv.

## Architecture

### Core Components

1. **CLI Interface** (`bin/create-c1-app`)
   - Entry point for the tool
   - Interactive prompts using `inquirer`
   - Progress indicators and user feedback

2. **Project Generator** (`src/generators/project.ts`)
   - Creates Next.js project using `create-next-app`
   - Configures project structure
   - Installs additional dependencies

3. **Authentication Module** (`src/auth/authenticator.ts`)
   - Handles user authentication flow
   - Manages session tokens
   - Validates credentials

4. **API Key Manager** (`src/api/keyManager.ts`)
   - Generates API keys via authenticated API calls
   - Validates key permissions
   - Handles key refresh/rotation

5. **Environment Manager** (`src/env/envManager.ts`)
   - Integrates with dotenv
   - Securely stores API keys
   - Manages environment configuration

## Workflow

### Step 1: Project Initialization
```
1. Prompt for project name and configuration
2. Create Next.js project using create-next-app
3. Navigate to project directory
4. Install additional dependencies (dotenv, API client)
```

### Step 2: User Authentication (Optional)
```
1. Prompt for API service credentials (email/password or token)
2. Authenticate with API service
3. Store session token securely
4. Validate authentication status
Note: Skipped when --api-key flag is provided
```

### Step 3: API Key Generation (Optional)
```
1. Use authenticated session to request API key
2. Specify key permissions/scopes if needed
3. Receive and validate API key
4. Handle any rate limiting or quota restrictions
Note: Skipped when --api-key flag is provided
```

### Step 4: Environment Setup
```
1. Set up dotenv in project
2. Create .env file with API key
3. Add .env to .gitignore
4. Configure Next.js for environment variables
```

## Dependencies

### Core Dependencies
- `inquirer` - Interactive CLI prompts
- `chalk` - Terminal colors and styling
- `ora` - Loading spinners
- `execa` - Process execution
- `fs-extra` - Enhanced file system operations

### TypeScript Dependencies
- `typescript` - TypeScript compiler
- `@types/node` - Node.js type definitions
- `@types/inquirer` - Inquirer type definitions
- `ts-node` - TypeScript execution environment

### Project Dependencies (installed in generated project)
- `dotenv` - Environment variables
- Custom API client library (if applicable)

## File Structure
```
create-c1-app/
├── package.json
├── tsconfig.json              # TypeScript configuration
├── bin/
│   └── create-c1-app              # CLI entry point
├── src/
│   ├── index.ts               # Main orchestrator
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── generators/
│   │   └── project.ts         # Next.js project creation
│   ├── auth/
│   │   └── authenticator.ts   # Authentication handling
│   ├── api/
│   │   └── keyManager.ts      # API key management
│   ├── env/
│   │   └── envManager.ts      # Environment setup
│   └── utils/
│       ├── logger.ts          # Logging utilities
│       ├── validation.ts      # Input validation
│       └── spinner.ts         # Progress indicators
├── dist/                      # Compiled JavaScript output
├── templates/
│   └── nextjs/                # Next.js templates/configs
└── README.md
```

## Configuration Options

### CLI Arguments
- `--project-name` (`-n`) - Specify project name
- `--template` (`-t`) - Next.js template (app/pages router)
- `--api-key` (`-k`) - API key to use (skips authentication and key generation)
- `--debug` (`-d`) - Enable debug logging

### Environment Variables
- `CREATE_C1_APP_ENDPOINT` - Default API endpoint
- `CREATE_C1_APP_TOKEN` - Pre-existing auth token
- `CREATE_C1_APP_DEBUG` - Enable debug logging

## Security Considerations

1. **Credential Storage**
   - Never store plaintext credentials
   - Use system keychain when possible
   - Temporary session tokens only

2. **API Key Protection**
   - Set up with dotenv
   - Generate unique keys per project
   - Implement key rotation capabilities

3. **Network Security**
   - Use HTTPS for all API calls
   - Validate SSL certificates
   - Implement request timeout/retry logic

## Error Handling

### Authentication Errors
- Invalid credentials → Re-prompt with helpful message
- Network errors → Retry with exponential backoff
- Rate limiting → Wait and inform user

### Project Creation Errors
- Directory exists → Prompt for overwrite/rename
- Permission errors → Suggest alternative location
- Dependency installation fails → Provide manual steps

### API Key Errors
- Generation fails → Retry with user confirmation
- Invalid permissions → Show available options
- Quota exceeded → Display usage information

## Testing Strategy

1. **Unit Tests**
   - Each module independently tested
   - Mock external API calls
   - Validate input/output contracts

2. **Integration Tests**
   - End-to-end tool flow
   - Real API interactions (test environment)
   - File system operations

3. **CLI Tests**
   - Command parsing and validation
   - Interactive prompt flows
   - Error scenario handling

## Future Enhancements



1. **Developer Experience**
   - Auto-completion for bash/zsh
   - VS Code extension
   - Documentation generation
   - Usage analytics (opt-in)

## Success Criteria

1. ✅ Creates functional Next.js project
2. ✅ Successfully authenticates users
3. ✅ Generates valid API keys
4. ✅ Stores credentials with dotenv
5. ✅ Provides clear error messages
6. ✅ Works across platforms (macOS, Linux, Windows)
7. ✅ Complete in under 2 minutes for typical usage

## Implementation Phases

### Phase 1: Core Functionality
- Basic CLI structure
- Next.js project creation
- Simple authentication flow

### Phase 2: Security & Environment
- dotenv integration
- Secure credential storage
- Environment validation

### Phase 3: Polish & Testing
- Error handling improvements
- Comprehensive testing
- Documentation and examples

