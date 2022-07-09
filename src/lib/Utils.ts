export async function loadImage (src: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      resolve(img)
    }

    img.onerror = (e) => {
      reject(e)
    }

    img.src = src
  })
}
export function hashCode (s: string): number {
  let h = 0

  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0
  }

  return h
}
