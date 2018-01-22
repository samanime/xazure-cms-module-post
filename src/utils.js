export const normalizePostTypes = (postTypes = {}) => Object.entries(postTypes).map(([type, p])  =>
  [type, typeof p === 'object' ? p : { name: p, path: `/${type}` }]
).reduce((r, [t, p]) => Object.assign(r, { [t]: p }), {});