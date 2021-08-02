function curry(fn, ...preserveArgs) {
  const _arguments = preserveArgs ? [...preserveArgs] : [];
  const argLength = fn.length;

  return function _curryFn(...middleArgs) {
    const contextArgs = _arguments.concat(middleArgs);
    if (contextArgs.length >= argLength) {
      return fn.apply(null, contextArgs);
    }

    return curry.apply(null, [fn, ...contextArgs]);
  }
}
