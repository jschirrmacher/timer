const match = location.search.match(/value=(\d+)/) || [0, 15 * 60]
let value = 'ontouchstart' in window ? 0 : Math.min(3600, Math.max(0, match[1]))

const config = {
    radius: 180,
    tickWidth: 10,
    tickLength: 30,
    fivesLength: 60,
    redSpacing: 20
}
config.ticks = config.radius * 2 * Math.PI
let inSet = false
let playSound = 0

const currentTime = document.getElementById('currentTime')
const sound = document.getElementById('sound')
const svg = document.getElementById('timer')
svg.appendChild(createTicks('fives', 12, config.fivesLength))
svg.appendChild(createTicks('fives', 60, config.tickLength))
const timer = createCircle('red', config.radius, '')
svg.appendChild(timer)

updateTimer()
window.setInterval(decrementToZero, 1000)
bindHandler(svg, 'mousedown touchstart', handleStart)
bindHandler(svg, 'mouseup touchend', handleEnd)
bindHandler(svg, 'mousemove touchmove', handleMove)
sound.addEventListener('ended', () => {
    if (--playSound) {
        sound.play()
    }
})

function bindHandler(el, events, listener) {
    events.split(' ').forEach(event => el.addEventListener(event, listener))
}

function handleStart(event) {
    inSet = true
    sound.play()
    sound.pause()
}

function handleMove(event) {
    if (inSet) {
        event.preventDefault()
        const pos = event.type === 'touchmove' ? event.changedTouches[0] : event
        const r = svg.getBoundingClientRect()
        const deltaX = pos.clientX - r.x - r.width / 2
        const deltaY = pos.clientY - r.y - r.height / 2
        value = ((270 - Math.atan2(deltaY, deltaX) * (180 / Math.PI)) % 360) * 10
        updateTimer()
    }
}

function handleEnd(event) {
    inSet = false
}

function updateTimer() {
    timer.setAttribute('style', 'stroke-width: ' + (config.radius) * 2 + '; stroke-dasharray: ' + (value / 3600 * config.ticks) + ',2000')
    currentTime.innerText = (new Date()).toLocaleTimeString()
}

function decrementToZero() {
    if (value > 0) {
        value--
        updateTimer()
        if (value <= 0) {
            playSound = 3
            sound.play()
        }
    }
}

function createTicks(id, count, length) {
    const radius = config.radius * 2 + config.redSpacing + length / 2
    const strokeArray = config.tickWidth + ',' + (radius * 2 * Math.PI / count - config.tickWidth)
    return createCircle(id, radius, length, strokeArray)
}

function createCircle(id, radius, strokeWidth, dashArray) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.id = id
    circle.setAttribute('cx', 500)
    circle.setAttribute('cy', 500)
    circle.setAttribute('r', radius)
    circle.setAttribute('style', 'stroke-width: ' + strokeWidth + '; stroke-dasharray: ' + dashArray)
    return circle
}