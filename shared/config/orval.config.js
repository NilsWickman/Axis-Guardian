module.exports = {
  gateway: {
    input: {
      target: '../contracts/gateway/auth.yaml',
    },
    output: {
      mode: 'split',
      target: '../generated/typescript/gateway',
      schemas: './models',
      client: 'react-query',
      override: {
        mutator: {
          path: './src/api/axios-instance.ts',
          name: 'customInstance',
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
  communications: {
    input: {
      target: '../contracts/communications/camera.yaml',
    },
    output: {
      mode: 'split',
      target: '../generated/typescript/communications',
      client: 'axios',
      override: {
        mutator: {
          path: './src/api/axios-internal.ts',
          name: 'internalInstance',
        },
      },
    },
  },
  intelligence: {
    input: {
      target: '../contracts/intelligence/*.yaml',
    },
    output: {
      mode: 'split',
      target: '../generated/typescript/intelligence',
      client: 'node',
    },
  },
};