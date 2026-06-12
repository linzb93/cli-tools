import unusedImports from "eslint-plugin-unused-imports";
import typescriptEslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";

export default [
    // 忽略目录
    {
        ignores: [
            "**/node_modules/**",
            "**/dist/**",
            "**/dist-ssr/**",
            "**/dist-electron/**",
            "**/coverage/**",
            "**/.claude/**",
            "**/__tests__/**",
            "**/memory/**",
        ],
    },

    // TypeScript 文件配置
    {
        files: [
            "packages/*/src/**/*.ts",
            "packages/*/src/**/*.tsx",
            "packages/*/*.ts",
            "packages/*/*.mts",
            "scripts/**/*.js",
        ],
        plugins: {
            "unused-imports": unusedImports,
            "@typescript-eslint": typescriptEslint.plugin,
        },
        languageOptions: {
            parser: typescriptEslint.parser,
            ecmaVersion: 2022,
            sourceType: "module",
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // unused-imports 规则
            "unused-imports/no-unused-imports": "warn",
            "unused-imports/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    varsIgnorePattern: "^_",
                    args: "after-used",
                    argsIgnorePattern: "^_",
                },
            ],
        },
    },

    // Vue 文件配置
    {
        files: ["packages/*/src/**/*.vue"],
        plugins: {
            "unused-imports": unusedImports,
            "@typescript-eslint": typescriptEslint.plugin,
        },
        languageOptions: {
            parser: vueParser,
            ecmaVersion: 2022,
            sourceType: "module",
            parserOptions: {
                parser: typescriptEslint.parser,
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
                extraFileExtensions: [".vue"],
            },
        },
        rules: {
            "unused-imports/no-unused-imports": "warn",
            "unused-imports/no-unused-vars": [
                "warn",
                {
                    vars: "all",
                    varsIgnorePattern: "^_",
                    args: "after-used",
                    argsIgnorePattern: "^_",
                },
            ],
        },
    },
];
