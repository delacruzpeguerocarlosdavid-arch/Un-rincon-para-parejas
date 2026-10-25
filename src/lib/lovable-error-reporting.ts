// Clean native runtime error logger (zero telemetry/external dependencies)
export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[Runtime Warning]', error, context);
  }
}
