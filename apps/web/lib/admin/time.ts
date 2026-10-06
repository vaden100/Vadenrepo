/** Server render time, passed to client clocks so their first render matches the HTML. */
export const renderTime = (): number => Date.now();
