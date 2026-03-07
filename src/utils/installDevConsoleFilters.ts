const FILTERED_WARNINGS = [
  'THREE.THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.',
  'using deprecated parameters for the initialization function; pass a single object instead',
  'Download the React DevTools for a better development experience: https://react.dev/link/react-devtools',
];

const shouldFilterMessage = (args: unknown[]) => {
  const [firstArg] = args;

  return (
    typeof firstArg === 'string' &&
    FILTERED_WARNINGS.some((message) => firstArg.startsWith(message))
  );
};

export const installDevConsoleFilters = () => {
  if (!import.meta.env.DEV) {
    return;
  }

  const methods = ['warn', 'info'] as const;

  methods.forEach((method) => {
    const original = console[method];

    console[method] = (...args: Parameters<typeof original>) => {
      if (shouldFilterMessage(args)) {
        return;
      }

      original(...args);
    };
  });
};
