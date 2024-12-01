/** 
 * @template T
 * @param {T[]} a
 * @param {T[]} b
 */
export const compareArrays = (a, b) => a === b || (a?.length === b?.length && a.every((element, index) => element === b[index]))

// TODO: Add typing
export const compareObjects = (a, b) => {
  if (a === b) return true
  if ((a && !b) || (!a && b)) return false

  const keysA = Object.keys(a).toSorted()
  const keysB = Object.keys(b).toSorted()

  return keysA.length === keysB.length && keysA.every((keyA, index) => {
    const keyB = keysB[index]
    
    if (keyA !== keyB) return false

    const itemA = a[keyA]
    const itemB = b[keyB]

    if (itemA === itemB) return true

    if (Array.isArray(itemA)) {
      return Array.isArray(itemB) ? compareArrays(itemA, itemB) : false
    }

    if (typeof itemA === 'object') {
      return typeof itemB === 'object' ? compareObjects(itemA, itemB) : false
    }

    return false
  })
}