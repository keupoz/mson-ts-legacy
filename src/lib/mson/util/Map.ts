export function computeIfAbsent<K, T> (map: Map<K, T>, key: K, compute: (key: K) => T): T {
  let result = map.get(key)

  if (result === undefined) {
    result = compute(key)
    map.set(key, result)
  }

  return result
}
