import 'dotenv/config';
import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'https://devapi.stance.health/graphql',
  documents: ['app/**/*.tsx', 'app/**/*.ts', 'components/**/*.tsx', 'components/**/*.ts'],
  ignoreNoDocuments: true,
  generates: {
    // Generate types for operations
    './gql/': {
      preset: 'client',
      plugins: [],
      config: {
        declarationKind: 'interface',
      },
    },
    // Generate React hooks
    './gql/hooks.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        withHooks: true,
        withHOC: false,
        withComponent: false,
        useTypeImports: true,
      },
    },
  },
};

export default config;
