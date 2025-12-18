type ConsoleMethod = (...args: unknown[]) => void

const noop: ConsoleMethod = () => {}

export function configureConsoleLogging(options?: { enableVerbose?: boolean }) {
  const enableVerbose = options?.enableVerbose ?? false
  if (enableVerbose) return

  console.log = noop
  console.info = noop
  console.debug = noop
  console.warn = noop
  console.trace = noop
}

