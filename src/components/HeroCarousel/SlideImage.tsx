import { carouselConfig } from '../../config/animation'
import type { Slide } from '../../data/slides'

const { portrait, landscape } = carouselConfig.layouts
// Each panel element is its own share of the panorama plus the cross-fade strip.
const PORTRAIT_SIZES = `${Math.round(portrait.slideWidth * (1 + carouselConfig.seam) * 100)}vw`
const LANDSCAPE_SIZES = `${Math.round(landscape.slideWidth * (1 + carouselConfig.seam) * 100)}vw`

interface SlideImageProps {
  slide: Slide
  /** Description in the current language; empty for decorative copies (the floor reflection). */
  alt: string
  priority?: boolean
}

/**
 * Art-directed, responsive image: portrait panels on portrait screens, landscape panels
 * elsewhere, AVIF first with a WebP fallback. The files are already cropped to the exact
 * panel shape, so the seams line up with the neighbouring panels.
 */
export function SlideImage({ slide, alt, priority = false }: SlideImageProps) {
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
        alt={alt}
        draggable={false}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </picture>
  )
}
