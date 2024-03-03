export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function mouseDrag(mousedownEvent, button, initCallbacks) {
  if (mousedownEvent.button === button) {
    mousedownEvent.preventDefault()
    const startMouseX = mousedownEvent.clientX
    const startMouseY = mousedownEvent.clientY
    const { onDrag, onDone } = initCallbacks()

    const handleMousemove = (mousemoveEvent) => {
      const deltaX = mousemoveEvent.clientX - startMouseX
      const deltaY = mousemoveEvent.clientY - startMouseY
      onDrag && onDrag(deltaX, deltaY)
    }

    const handleMouseup = () => {
      if (mousedownEvent.button === button) {
        document.removeEventListener('mousemove', handleMousemove)
        document.removeEventListener('mouseup', handleMouseup)
        onDone && onDone()
      }
    }

    document.addEventListener('mousemove', handleMousemove)
    document.addEventListener('mouseup', handleMouseup)
  }
}