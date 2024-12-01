import { compareArrays } from './helpers.js'
import { ref } from './ref.js'

let templateIdGenerator = 0

/** 
 * @param {(insert: (node: Node) => Node) => void} callback 
 * @param {Document | ShadowRoot | Element} [root] 
 */
export const modify = (callback, root = document.body) => {
  const templateId = `_feppla_template_${++templateIdGenerator}_`

  queueMicrotask(() => {
    /** @type {Node | null} */
    let implicitInsertionPoint = null

    const commentIterator = document.createNodeIterator(root, NodeFilter.SHOW_COMMENT);
    let currentComment = null
    while (currentComment = commentIterator.nextNode()) {
      if (currentComment.textContent === templateId)  {
        implicitInsertionPoint = currentComment
        break
      }
    }

    if (!implicitInsertionPoint) {
      console.error('Implicit insertion point could not be found during templating!')
      return
    }

    const parent = implicitInsertionPoint.parentNode
    if (!parent) {
      // Should never happen in practice due to NodeIterator traversal
      console.error('Implicit insertion point is missing parent!')
      return
    }

    const insert = (/** @type {Node} */ node) => parent.insertBefore(node, implicitInsertionPoint)
    callback(insert)

    parent.removeChild(implicitInsertionPoint)
  })

  return `<!--${templateId}-->`
}

/** 
 * @template T
 * @param {((el: Node) => T[]) | { value: (el: Node) => T[], equals: (a: T[], b: T[]) => boolean}} valueFuncOrDef 
 * @param {(value: T, index: number) => string} renderFunc 
 */
export const repeat = (valueFuncOrDef, renderFunc) => modify((insert) => {
  const startNode = insert(document.createTextNode(''))
  const endNode = insert(document.createTextNode(''))
  const renderTemplate = document.createElement('template')

  ref(startNode)
    .set(
      valueFuncOrDef,
      (_, items) => {
        /** @type {Node[]} */
        let currentContent = []
        const parentElement = /** @type {Node} */(startNode.parentNode)
        
        
        /** @type {Node | null} */
        let contentNode = startNode
        while ((contentNode = contentNode.nextSibling) != endNode) {
          if (contentNode == null) {
            console.error('Repeat end point is missing!')
            return
          }
          currentContent.push(contentNode)
        }
        
        for (let index = 0 ; index < items.length ; ++index) {
          const item = items[index]
          const key = item

          let elements = []
          const remaining = []
          currentContent.forEach((x) => /**@type {any}*/(x)._key === key ? elements.push(x) : remaining.push(x))
          currentContent = remaining
      
          if (!elements.length) {
            if (parentElement instanceof SVGElement) {
              renderTemplate.innerHTML = `<svg>${renderFunc(item, index)}</svg>`
              elements = Array.from(renderTemplate.content.children[0].children)
            } else {
              renderTemplate.innerHTML = renderFunc(item, index)
              elements = Array.from(renderTemplate.content.children)
            }
            elements.forEach(element => {
              /**@type {any}*/(element)._key = key
            })
          }
          
          for (let i = 0 ; i < elements.length ; ++i) {
            parentElement.insertBefore(elements[i], endNode)
          }
        }
      
        for (let i = 0 ; i < currentContent.length ; ++i) {
          parentElement.removeChild(currentContent[i])
        }
      }
    )
    .done()
})

// TODO: Fix better typing for truthy / falsy separation?
/** 
 * @template T 
 * @param {(el: Node) => T | undefined | null | false | 0 | ''} valueFunc 
 * @param {(value: T) => string} renderFunc 
 */
export const when = (valueFunc, renderFunc) => repeat(
  { 
    value: (...args) => [valueFunc(...args)], 
    equals: compareArrays
  }, 
  (value) => value ? renderFunc(value) : ''
)

/** 
 * @param {(el: Node) => any} valueFunc 
 */
export const text = (valueFunc) => modify((insert) => {
  ref(insert(document.createTextNode('')))
    .set(valueFunc, (node, value) => node.textContent = value)
    .done()
})
