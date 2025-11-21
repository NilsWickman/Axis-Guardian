# Configuration Directory

This directory contains all configuration files for the AXIS Surveillance Interface.

## Structure

```
config/
├── build/              # Build-time configurations
│   ├── vite.config.ts         # Vite build configuration
│   ├── tailwind.config.ts     # Tailwind CSS configuration
│   ├── postcss.config.js      # PostCSS configuration
│   └── components.json        # Shadcn-vue components configuration
├── lint/               # Code quality configurations
│   ├── eslint.config.js       # ESLint configuration
│   ├── .prettierrc.json       # Prettier formatting rules
│   └── .prettierignore        # Prettier ignore patterns
├── types/              # TypeScript configurations
│   ├── tsconfig.json          # Main TypeScript configuration
│   ├── tsconfig.app.json      # App-specific TypeScript config
│   └── tsconfig.node.json     # Node.js TypeScript config
├── dev/                # Development configurations
│   └── environment.ts         # Development environment setup
└── index.ts            # Configuration exports
```

## Usage

All pnpm scripts in package.json directly reference these configuration files:

```bash
# Development
pnpm dev                # Uses config/build/vite.config.ts
pnpm type-check         # Uses config/types/tsconfig.json

# Code Quality
pnpm lint               # Uses config/lint/eslint.config.js
pnpm format             # Uses config/lint/.prettierrc.json
```

## Benefits

- **🎯 Centralized**: All configs in one organized directory
- **📂 Categorized**: Grouped by purpose (build, lint, types, dev)
- **🧹 Clean Root**: No config clutter in project root
- **🔧 Direct References**: Tools use configs directly, no proxy files
- **📖 Self-Documenting**: Clear structure shows config relationships