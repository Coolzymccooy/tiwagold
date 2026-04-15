const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'build/**',
      'ios/**',
      'android/**',
      'legacy-web/**',
      'expo-env.d.ts',
    ],
  },
  {
    rules: {
      'import/no-unresolved': 'off',
    },
  },
];
