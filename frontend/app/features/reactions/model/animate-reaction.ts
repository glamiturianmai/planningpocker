import type { ReactionEvent } from '@/api/rooms'
import { REACTION_ASSETS } from './reactions'

type Point = { x: number; y: number }
type Rebound = { distance: number; velocity: number; rotation: number }
const MAX_ACTIVE_ANIMATIONS = 60
const APPROACH_DISTANCE = 280
const OFFSCREEN_MARGIN = 40
const PATH_STEPS = 28
const MIN_FLIGHT_MS = 650
const MAX_FLIGHT_MS = 1100
const FALL_STEPS = 24
const GRAVITY = 1600
const MIN_REBOUND_VELOCITY = 160
const MAX_REBOUND_VELOCITY = 280
const MIN_REBOUND_DISTANCE = 35
const MAX_REBOUND_DISTANCE = 180
const MIN_REBOUND_ROTATION = 25
const MAX_REBOUND_ROTATION = 140
const FLOOR_DRIFT = 18
const PARTICLE_RADIUS = 19
const PARTICLE_HORIZONTAL_MARGIN = 28
const FLOOR_BOUNCE_MS = 350
const FLOOR_REST_MS = 1500
const FADE_DURATION_MS = 800

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function move(x: number, y: number, scale = 1, rotation = 0) {
  return `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${scale})`
}
function findCard(userId?: string | null) {
  return [...document.querySelectorAll<HTMLElement>('[data-player-id]')]
    .find((element) => element.dataset.playerId === userId)
    ?.querySelector<HTMLElement>('.card-target')
}
function flightPath(source: Point, target: Point, emoji: string) {
  const dx = target.x - source.x
  const dy = target.y - source.y
  const distance = Math.hypot(dx, dy)
  const control = {
    x: (source.x + target.x) / 2,
    y: Math.min(source.y, target.y) - Math.min(100, 35 + distance * 0.18),
  }
  const frames = Array.from(
    { length: PATH_STEPS + 1 },
    (_, index): Keyframe => {
      const t = index / PATH_STEPS
      const remaining = 1 - t
      const x =
        remaining * remaining * source.x +
        2 * remaining * t * control.x +
        t * t * target.x
      const y =
        remaining * remaining * source.y +
        2 * remaining * t * control.y +
        t * t * target.y
      const tangentX =
        remaining * (control.x - source.x) + t * (target.x - control.x)
      const tangentY =
        remaining * (control.y - source.y) + t * (target.y - control.y)
      const rotation =
        emoji === '✈️'
          ? (Math.atan2(tangentY, tangentX) * 180) / Math.PI + 45
          : emoji === '📄'
            ? t * 300
            : Math.sin(t * Math.PI) * 16
      return {
        offset: t,
        transform: move(
          x - source.x,
          y - source.y,
          0.8 + Math.sin(t * Math.PI) * 0.2,
          rotation,
        ),
        opacity: Math.min(1, t * 10),
      }
    },
  )
  const impactRotation =
    emoji === '✈️'
      ? (Math.atan2(target.y - control.y, target.x - control.x) * 180) /
          Math.PI +
        45
      : emoji === '📄'
        ? 300
        : 0
  return { frames, impactRotation }
}

function throwAndSettlePath(
  source: Point,
  target: Point,
  emoji: string,
  flightDuration: number,
  direction: number,
  floorY: number,
  rebound: Rebound,
) {
  const path = flightPath(source, target, emoji)
  const fallDistance = floorY - target.y
  const fallSeconds =
    (rebound.velocity +
      Math.sqrt(rebound.velocity ** 2 + 2 * GRAVITY * fallDistance)) /
    GRAVITY
  const landingTime = flightDuration + fallSeconds * 1000
  const restEnd = landingTime + FLOOR_BOUNCE_MS + FLOOR_REST_MS
  const duration = restEnd + FADE_DURATION_MS
  const frames: Keyframe[] = path.frames.map((frame) => ({
    ...frame,
    offset: (Number(frame.offset) * flightDuration) / duration,
  }))
  for (let step = 1; step <= FALL_STEPS; step++) {
    const t = step / FALL_STEPS
    const seconds = t * fallSeconds
    const x =
      target.x + direction * rebound.distance * Math.sin((t * Math.PI) / 2)
    const y =
      target.y - rebound.velocity * seconds + (GRAVITY * seconds ** 2) / 2
    frames.push({
      offset: (flightDuration + seconds * 1000) / duration,
      transform: move(
        x - source.x,
        y - source.y,
        0.8,
        path.impactRotation + direction * rebound.rotation * t,
      ),
      opacity: 1,
    })
  }
  const landingX = target.x + direction * rebound.distance
  const landingRotation = path.impactRotation + direction * rebound.rotation
  const bounces = [
    { time: 80, lift: 16, drift: 8, rotation: 10 },
    { time: 200, lift: 0, drift: 14, rotation: 18 },
    { time: 260, lift: 5, drift: 16, rotation: 20 },
    { time: FLOOR_BOUNCE_MS, lift: 0, drift: FLOOR_DRIFT, rotation: 22 },
  ]
  for (const bounce of bounces) {
    frames.push({
      offset: (landingTime + bounce.time) / duration,
      transform: move(
        landingX + direction * bounce.drift - source.x,
        floorY - bounce.lift - source.y,
        0.8,
        landingRotation + direction * bounce.rotation,
      ),
      opacity: 1,
    })
  }
  const restingTransform = frames[frames.length - 1]!.transform
  frames.push(
    { offset: restEnd / duration, transform: restingTransform, opacity: 1 },
    { offset: 1, transform: restingTransform, opacity: 0 },
  )
  return { frames, duration }
}

export function createReactionAnimator(overlay: HTMLElement) {
  const active = new Set<Animation>()
  let disposed = false

  function animate(
    element: HTMLElement,
    frames: Keyframe[],
    options: KeyframeAnimationOptions,
    cleanup?: () => void,
  ) {
    if (disposed || active.size >= MAX_ACTIVE_ANIMATIONS) {
      cleanup?.()
      return
    }
    const animation = element.animate(frames, { fill: 'forwards', ...options })
    active.add(animation)
    animation.onfinish = () => {
      active.delete(animation)
      cleanup?.()
      animation.oncancel = null
      animation.cancel()
    }
    animation.oncancel = () => {
      active.delete(animation)
      cleanup?.()
    }
  }
  function particle(
    emoji: string,
    origin: Point,
    frames: Keyframe[],
    options: KeyframeAnimationOptions,
    effect: string,
  ) {
    const element = document.createElement('span')
    element.className = 'reaction-particle'
    element.dataset.effect = effect
    element.dataset.reaction = emoji
    element.style.left = `${origin.x}px`
    element.style.top = `${origin.y}px`
    if (REACTION_ASSETS[emoji]) {
      const image = document.createElement('img')
      image.src = REACTION_ASSETS[emoji]
      image.alt = ''
      element.append(image)
    } else element.textContent = emoji
    overlay.append(element)
    animate(element, frames, options, () => element.remove())
  }
  function bump(card: HTMLElement, delay: number) {
    if (!card.isConnected) return
    animate(
      card,
      [
        { transform: 'rotate(0) scale(1)' },
        { transform: 'rotate(-4deg) scale(.96)', offset: 0.3 },
        { transform: 'rotate(3deg) scale(1.02)', offset: 0.65 },
        { transform: 'rotate(0) scale(1)' },
      ],
      { duration: 300, delay, easing: 'ease-out' },
    )
  }
  function play(event: ReactionEvent) {
    if (disposed) return
    const card = findCard(event.target_user_id ?? event.user_id)
    if (!card) return
    const rect = card.getBoundingClientRect()
    const listRect = card.closest('.players')?.getBoundingClientRect()
    if (
      rect.bottom < (listRect?.top ?? 0) ||
      rect.top > (listRect?.bottom ?? window.innerHeight)
    )
      return
    const target = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      particle(
        event.emoji,
        target,
        [
          { opacity: 0 },
          { opacity: 1, offset: 0.1 },
          { opacity: 1, offset: 0.8 },
          { opacity: 0 },
        ],
        { duration: 1000 },
        'reduced',
      )
      return
    }
    const direction = event.side === 'right' ? 1 : -1
    const source = {
      x: Math.max(
        -OFFSCREEN_MARGIN,
        Math.min(
          window.innerWidth + OFFSCREEN_MARGIN,
          target.x + direction * APPROACH_DISTANCE,
        ),
      ),
      y: target.y + 70,
    }
    const duration = Math.max(
      MIN_FLIGHT_MS,
      Math.min(
        MAX_FLIGHT_MS,
        500 + Math.hypot(target.x - source.x, target.y - source.y) * 0.8,
      ),
    )
    const floorY = Math.max(
      target.y,
      Math.min(listRect?.bottom ?? window.innerHeight, window.innerHeight) -
        PARTICLE_RADIUS,
    )
    const edgeDistance = direction < 0 ? target.x : window.innerWidth - target.x
    const availableDistance = Math.min(
      MAX_REBOUND_DISTANCE,
      Math.max(0, edgeDistance - PARTICLE_HORIZONTAL_MARGIN - FLOOR_DRIFT),
    )
    const rebound: Rebound = {
      distance: randomBetween(
        Math.min(MIN_REBOUND_DISTANCE, availableDistance / 2),
        availableDistance,
      ),
      velocity: randomBetween(MIN_REBOUND_VELOCITY, MAX_REBOUND_VELOCITY),
      rotation: randomBetween(MIN_REBOUND_ROTATION, MAX_REBOUND_ROTATION),
    }
    const trajectory = throwAndSettlePath(
      source,
      target,
      event.emoji,
      duration,
      direction,
      floorY,
      rebound,
    )
    particle(
      event.emoji,
      source,
      trajectory.frames,
      { duration: trajectory.duration, easing: 'linear' },
      'throw',
    )
    bump(card, duration)
  }
  function dispose() {
    disposed = true
    for (const animation of active) animation.cancel()
    active.clear()
  }
  return { play, dispose }
}
