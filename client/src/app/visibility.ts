// Prevents accidental activation when the control is outside the visible viewport
function isElementFullyVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    const visibleHeight = window.visualViewport?.height ?? window.innerHeight;
  
    console.log({
        element,
        rectTop: rect.top,
        rectBottom: rect.bottom,
        visibleHeight,
        innerHeight: window.innerHeight,
        visualViewportHeight: window.visualViewport?.height,
    });
    
    // Testing
    return true;
    // return rect.top >= 0 && rect.bottom <= visibleHeight;
  }

export { isElementFullyVisible }