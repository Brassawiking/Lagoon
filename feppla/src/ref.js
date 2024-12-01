let refIdGenerator = 0

let liveQueue = []
let liveWatchers = 0
requestAnimationFrame(function processLiveQueue() {
  const currentQueue = liveQueue
  liveQueue = []
  liveWatchers = currentQueue.length
  for (let i = 0 ; i < currentQueue.length; ++i) {
    currentQueue[i]()
  }
  requestAnimationFrame(processLiveQueue)
})
export const debugLiveWatchers = () => liveWatchers

/** 
 * @param {Node} [explicitNode] 
 * @param {Document | ShadowRoot | Element} [root] 
 */
export const ref = (explicitNode, root = document) => {
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
      api.node((el) => {
        callback(el)
        liveQueue.push(function update() {
          if (el.isConnected) {
            callback(el)
            liveQueue.push(update)
          }
        })
      })
      return api
    },

    /** 
     * @template T
     * @param {((el: Node) => T) | { value: (el: Node) => T, equals: ((a: T, b: T) => boolean) | undefined}} valueFuncOrDef
     * @param {(el: Node, newValue: T, oldValue: T) => void} setterFunc 
     */
    set: (valueFuncOrDef, setterFunc) => {
      let oldValue
      let initialSet = false

      let valueFunc
      let equalsFunc = (/** @type {T}*/ a, /** @type {T}*/ b) => a === b
      
      if (typeof valueFuncOrDef === 'function') {
        valueFunc = valueFuncOrDef
      } else {
        valueFunc = valueFuncOrDef.value
        equalsFunc = valueFuncOrDef.equals ?? equalsFunc
      }

      api.live((el) => {
        const newValue = valueFunc(el)
        if (!equalsFunc(newValue, oldValue) || !initialSet) {
          setterFunc(el, newValue, oldValue)
          oldValue = newValue
          initialSet = true
        }
      })
      return api
    },

    /** 
     * @template {keyof GlobalEventHandlersEventMap} TEventType
     * @template {GlobalEventHandlersEventMap[TEventType] & { target: any}} TEvent
     * @param {TEventType} type 
     * @param {(event: TEvent, el: Node) => void} listener
     * @param {boolean | AddEventListenerOptions | undefined} options
     */
    on: (type, listener, options = {}) => {
      api.node((el) => el.addEventListener(type, /**@param {any} event*/(event) => listener(event, el), options))
      return api
    },

    /**
     * @param {string} property 
     * @param {(el: Node) => { value: string, important: boolean} | string} valueFunc
     */
    style: (property, valueFunc) => {
      api.set(valueFunc, (el, valueOrObject) => {
        let value
        let important = false
        
        if (typeof valueOrObject === 'object') {
          value = valueOrObject.value
          important = valueOrObject.important
        } else {
          value = valueOrObject
        }

        /**@type {HTMLElement | SVGElement}*/(el).style.setProperty(property, value, important ? 'important' : '')
      })
      return api
    },

    /** 
     * @param {string} property 
     * @param {(el: Node) => any} valueFunc
     */
    property: (property, valueFunc) => {
      api.set(valueFunc, (el, value) => el[property] = value)
      return api
    },

    /** 
     * @param {string} attribute 
     * @param {(el: Node) => any} valueFunc
     */
    attribute: (attribute, valueFunc) => {
      api.set(valueFunc, (el, value) => /**@type {HTMLElement | SVGElement}*/(el).setAttribute(attribute, value))
      return api
    },

    /** 
     * @param {string} className 
     * @param {(el: Node) => any} valueFunc
     */
    class: (className, valueFunc) => {
      api.set(valueFunc, (el, value) => /**@type {HTMLElement | SVGElement}*/(el).classList.toggle(className, value))
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
        const implicitNode = root.querySelector(`[${refAttribute}]`)
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
