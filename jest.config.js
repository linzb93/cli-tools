export default {
    roots: [
        "<rootDir>/dist"
    ],
    testRegex: 'dist/(.+)\\.test\\.(jsx?|tsx?)$',
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    transformIgnorePatterns: ['/node_modules/(?!.*@babel)[^/]+?/'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};