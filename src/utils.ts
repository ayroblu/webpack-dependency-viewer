export function orderBy<T, V extends Date | number | string>(
  funcs: ((t: T) => V)[],
  order: ('asc' | 'desc')[]
) {
  return (a: T, b: T) => {
    for (let i = 0; i < funcs.length; ++i) {
      const func = funcs[i]!;
      if (func(a) > func(b)) {
        return order[i] === 'desc' ? -1 : 1;
      } else if (func(b) > func(a)) {
        return order[i] === 'desc' ? 1 : -1;
      }
    }
    return 0;
  };
}
