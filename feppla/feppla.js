let refIdGenerator = 0
export const debugRefCounter = () => refIdGenerator

let templateIdGenerator = 0
export const debugTemplateCounter = () => templateIdGenerator

let liveWatchers = 0
let liveQueue = []
requestAnimationFrame(function processLiveQueue() {
  const currentQueue = liveQueue
  liveQueue = []
  for (let i = 0 ; i < currentQueue.length; ++i) {
    currentQueue[i]()
  }
  requestAnimationFrame(processLiveQueue)
})
export const debugLiveWatchers = () => liveWatchers

/** 
 * @param {Node} [explicitNode] 
 */
export const ref = (explicitNode) => {
  /** @type {((el: Node) => void)[]} */
  const callbacks = []

  const api = {    
    /** 
     * @param {(el: Node) => void} callback 
     */
    node: (callback) => {
      callbacks.push(callback)
      return api
    },

    /** 
     * @param {(el: Node) => void} callback 
     */
    live: (callback) => {
      callbacks.push((el) => {
        ++liveWatchers
        callback(el)
        liveQueue.push(function update() {
          if (el.isConnected) {
            callback(el)
            liveQueue.push(update)
          } else {
            --liveWatchers
          }
        })
      })
      return api
    },

    /** 
     * @template T
     * @param {(el: Node, newValue: T, oldValue: T) => void} setter 
     * @param {(el: Node) => T} valueFunc
     * @param {(a: T, b: T) => boolean} equalsFunc
     */
    set: (setter, valueFunc, equalsFunc = (a, b) => a === b) => {
      let oldValue
      api.live((el) => {
        const newValue = valueFunc(el)
        if (!equalsFunc(newValue, oldValue)) {
          setter(el, newValue, oldValue)
          oldValue = newValue
        }
      })
      return api
    },

    // TODO: Make "on" set based instead so you can change or remove the event listener dynamically
    /** 
     * @template {keyof GlobalEventHandlersEventMap} TEventType
     * @template {GlobalEventHandlersEventMap[TEventType] & { target: any}} TEvent
     * @param {TEventType} type 
     * @param {(event: TEvent, el: Node) => void} callback
     * @param {boolean | AddEventListenerOptions | undefined} options
     */
    on: (type, callback, options = {}) => {
      api.node((el) => el.addEventListener(type, /**@param {any} event*/(event) => callback(event, el), options))
      return api
    },

    /** 
     * @param {string} property 
     * @param {(el: Node) => any} valueFunc
     */
    style: (property, valueFunc) => {
      api.set((el, value) => /**@type {HTMLElement | SVGElement}*/(el).style[property] = value, valueFunc)
      return api
    },

    /** 
     * @param {string} property 
     * @param {(el: Node) => any} valueFunc
     */
    property: (property, valueFunc) => {
      api.set((el, value) => el[property] = value, valueFunc)
      return api
    },

    /** 
     * @param {string} attribute 
     * @param {(el: Node) => any} valueFunc
     */
    attribute: (attribute, valueFunc) => {
      api.set((el, value) => /**@type {HTMLElement | SVGElement}*/(el).setAttribute(attribute, value), valueFunc)
      return api
    },

    /** 
     * @param {string} className 
     * @param {(el: Node) => any} valueFunc
     */
    class: (className, valueFunc) => {
      api.set((el, value) => /**@type {HTMLElement | SVGElement}*/(el).classList.toggle(className, value), valueFunc)
      return api
    },

    done: () => {
      if (!explicitNode) {
        console.error('Called .done() without explict node reference!')
        return
      }

      for (let i = 0 ; i < callbacks.length ; ++i) {
        callbacks[i](explicitNode)
      }
    },

    toString: () => {
      if (explicitNode) {
        console.error('Used deferred referencing with explicit node reference!')
        return ''
      }

      const refAttribute = `_ref_${++refIdGenerator}_`

      queueMicrotask(() => {
        const implicitNode = document.querySelector(`[${refAttribute}]`)
        if (!implicitNode) {
          console.error('Implicit node could not be found during referencing!')
          return
        }
        implicitNode.removeAttribute(refAttribute)

        for (let i = 0 ; i < callbacks.length ; ++i) {
          callbacks[i](implicitNode)
        }
      })
    
      return refAttribute
    }
  }

  return api
}

const renderTemplate = document.createElement('template')
const validateRepeatRenderingSingleRoot = (children) => children.length > 1 && console.error('Repeat does not support multiple roots in render function, remaining roots omitted!')

/** 
 * @param {Node} [explicitInsertionPoint] 
 */
export const template = (explicitInsertionPoint) => {
  /** @type {((insert: (node: Node) => Node) => void)[]} */
  const callbacks = []

  const api = {
    /** 
     * @param {(insert: (node: Node) => Node) => void} callback 
     */
    modify: (callback) => {
      callbacks.push(callback)
      return api
    },

    /** 
     * @param {(el: Node) => string} valueFunc 
     */
    text: (valueFunc) => {
      api.modify((insert) => {
        ref(insert(document.createTextNode('')))
          .set((node, value) => node.textContent = value, valueFunc)
          .done()
      })
      return api
    },

    // TODO: Remove in favor of repeat as basis instead?
    /** 
     * @template T 
     * @param {(el: Node) => T} valueFunc 
     * @param {(value: T) => string} renderFunc 
     */
    conditional: (valueFunc, renderFunc) => {
      api.modify((insert) => {
        const startNode = insert(document.createTextNode(''))
        const endNode = insert(document.createTextNode(''))

        ref(startNode)
          .set(
            (_, value) => {
              /** @type {Node[]} */
              const currentContent = []
              const parentElement = /** @type {Node} */(startNode.parentNode)
              
              /** @type {Node | null} */
              let contentNode = startNode 
              while ((contentNode = contentNode.nextSibling) != endNode) {
                if (contentNode == null) {
                  console.error('Conditional end point is missing!')
                  return
                }
                currentContent.push(contentNode)
              }

              for (let i = 0 ; i < currentContent.length ; ++i) {
                parentElement?.removeChild(currentContent[i])
              }

              let elements
              if (parentElement instanceof SVGElement) {
                renderTemplate.innerHTML = `<svg>${renderFunc(value)}</svg>`
                elements = Array.from(renderTemplate.content.children[0].children)
              } else {
                renderTemplate.innerHTML = renderFunc(value)
                elements = Array.from(renderTemplate.content.children)
              }

              for (let i = 0 ; i < elements.length ; ++i) {
                parentElement.insertBefore(elements[i], endNode)
              }
            }, 
            valueFunc
          )
          .done()
      })
      return api
    },

    // TODO: Support for multiple render roots by using text nodes as markers
    /** 
     * @template T 
     * @param {(el: Node) => T[]} valueFunc 
     * @param {(value: T, index: number) => string} renderFunc 
     * @param {(item: T, index: number) => any} keyFunc 
     * @param {(a: T[], b: T[]) => boolean} equalsFunc 
     */
    repeat: (valueFunc, renderFunc, keyFunc = (item, index) => item, equalsFunc) => {
      api.modify((insert) => {
        const startNode = insert(document.createTextNode(''))
        const endNode = insert(document.createTextNode(''))

        ref(startNode)
          .set(
            (_, items) => {
              /** @type {Node[]} */
              const currentContent = []
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
                const key = keyFunc(item, index)
                const currentElementIndex = currentContent.findIndex(x => /**@type {any}*/(x)._key === key)
                let element
            
                if (currentElementIndex < 0) {
                  if (parentElement instanceof SVGElement) {
                    renderTemplate.innerHTML = `<svg>${renderFunc(item, index)}</svg>`
                    element = renderTemplate.content.children[0].children[0]
                    validateRepeatRenderingSingleRoot(renderTemplate.content.children[0].children)
                  } else {
                    renderTemplate.innerHTML = renderFunc(item, index)
                    element = renderTemplate.content.children[0]
                    validateRepeatRenderingSingleRoot(renderTemplate.content.children)
                  }
                  /**@type {any}*/(element)._key = key
                } else {
                  element = currentContent.splice(currentElementIndex, 1)[0]
                }
                parentElement.insertBefore(element, endNode)
              }
            
              for (let i = 0 ; i < currentContent.length ; ++i) {
                parentElement.removeChild(currentContent[i])
              }
            },
            valueFunc,
            equalsFunc
          )
          .done()
      })
      return api
    },

    if: (valueFunc, renderFunc) => {
      // TODO: Use repeat instead?
      api.conditional(valueFunc, (value) => value ? renderFunc(value) : '')
      return api
    },

    switch: (valueFunc, renderFuncs) => {
      api.conditional(valueFunc, (value) => renderFuncs[value]?.() || '')
      return api
    },

    done: () => {
      if (!explicitInsertionPoint) {
        console.error('Called .done() without explict insertion point!')
        return
      }
      const parent = explicitInsertionPoint.parentNode 
      if (!parent) {
        console.error('Called .done() with parentless explict insertion point!')
        return
      }

      const insert = (node) => parent.insertBefore(node, explicitInsertionPoint)
      for (let i = 0 ; i < callbacks.length ; ++i) {
        callbacks[i](insert)
      }
    },

    toString: () => {
      if (explicitInsertionPoint) {
        console.error('Used deferred templating with explicit insertion point!')
        return ''
      }

      const templateId = `_template_${++templateIdGenerator}_`

      queueMicrotask(() => {
        const commentIterator = document.createNodeIterator(document.body, NodeFilter.SHOW_COMMENT);

        /** @type {Node | null} */
        let implicitInsertionPoint = null
        /** @type {Node | null} */
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
          console.error('Implicit insertion point is missing parent!')
          return
        }

        const insert = (node) => parent.insertBefore(node, implicitInsertionPoint)
        for (let i = 0 ; i < callbacks.length ; ++i) {
          callbacks[i](insert)
        }

        parent.removeChild(implicitInsertionPoint)
      })
    
      return `<!--${templateId}-->`
    }
  }

  return api
}

export const text = (...args) => template().text.apply(null, args)
export const iffy = (...args) => template().if.apply(null, args)
export const repeat = (...args) => template().repeat.apply(null, args)
export const switchy = (...args) => template().switch.apply(null, args)
export const conditional = (...args) => template().conditional.apply(null, args)

// Helpers
/** 
 * @template T
 * @param {T[]} a
 * @param {T[]} b
 */
export const compareArrays = (a, b) => a === b || (a?.length === b?.length && a.every((element, index) => element === b[index]))
