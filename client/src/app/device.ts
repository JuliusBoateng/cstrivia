// Determines whether focus/input behavior should follow touch-device rules
function isTouchDevice(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}

// Determines whether the compact/mobile clue layout is active
// Note: mobile layout can be active without isTouchDevice()
function isMobileLayout(): boolean {
  return window.matchMedia("(max-width: 900px)").matches;
}

export { isTouchDevice, isMobileLayout };
