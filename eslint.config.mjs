// @ts-check

import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config({
    languageOptions: {
        parserOptions: {
            project: true, // Use the nearest tsconfig.json
            tsconfigRootDir: import.meta.dirname // Adjust for ES modules
        }
    },
    files: ['**/*.ts'], // Apply to all TypeScript files
    extends: [
        eslint.configs.recommended, // ESLint recommended rules
        ...tseslint.configs.recommendedTypeChecked, // TypeScript recommended rules
        eslintConfigPrettier // Disable conflicting Prettier rules
    ],
    rules: {
        // 'no-console': 'error',
        'no-useless-catch': 0, // Allow unnecessary catch blocks
        quotes: ['error', 'single', { allowTemplateLiterals: true }] // Enforce single quotes
    }
})
