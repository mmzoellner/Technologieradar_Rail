const spfxProfile = require('@microsoft/eslint-config-spfx/lib/flat-profiles/default');

module.exports = [
  ...spfxProfile,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // JSON backups from the Windows application use null for an unset target.
      '@rushstack/no-new-null': 'off',
      'no-void': ['warn', { allowAsStatement: true }]
    },
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json'
      }
    }
  }
];
