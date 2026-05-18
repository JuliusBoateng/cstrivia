function isTouchDevice(): boolean {
    return window.matchMedia("(pointer: coarse)").matches;
}

export { isTouchDevice }