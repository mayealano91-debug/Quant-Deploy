const makeStub = () => {
  const fn = () => Promise.resolve(null);
  return new Proxy(fn, {
    get: (_t, _k) => makeStub(),
    apply: () => Promise.resolve(null),
  });
};

export const base44 = makeStub();
