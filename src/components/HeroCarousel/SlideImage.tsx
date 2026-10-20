import type { CSSProperties } from 'react'
import { carouselConfig } from '../../config/animation'
import type { Slide } from '../../data/slides'

const { portrait, landscape } = carouselConfig.layouts
const PORTRAIT_SIZES = `${Math.round(portrait.slideWidth * 100)}vw`
const LANDSCAPE_SIZES = `${Math.round(landscape.slideWidth * 100)}vw`

interface SlideImageProps {
  slide: Slide
  /** Decorative copies (the floor reflection) get an empty alt text. */
  decorative?: boolean
  priority?: boolean
}

/**
 * Art-directed, responsive image: 4:5 crops on portrait screens, landscape variants
 * elsewhere, AVIF first with a WebP fallback.
 */
export function SlideImage({ slide, decorative = false, priority = false }: SlideImageProps) {
  const { image } = slide
  return (
    <picture>
      <source media={portrait.query} type="image/avif" srcSet={image.portrait.avif} sizes={PORTRAIT_SIZES} />
      <source media={portrait.query} type="image/webp" srcSet={image.portrait.webp} sizes={PORTRAIT_SIZES} />
      <source type="image/avif" srcSet={image.landscape.avif} sizes={LANDSCAPE_SIZES} />
      <source type="image/webp" srcSet={image.landscape.webp} sizes={LANDSCAPE_SIZES} />
      <img
        className="hc-slide__img"
        src={image.fallback}
        alt={decorative ? '' : slide.alt}
        draggable={false}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        style={{ '--focus': image.focus } as CSSProperties}
      />
    </picture>
  )
}
