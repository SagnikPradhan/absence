import Server from "absence"
import { parse, serialize, CookieSerializeOptions } from "cookie"
import { createHmac, timingSafeEqual } from "node:crypto"

export interface CookieOptions extends Omit<CookieSerializeOptions, "encode"> {
  secret?: string
}

export function cookie({ secret, ...options }: CookieOptions) {
  return Server.declareHandler(async ({ request, response }) => {
    const cookiesFromHeader = request.headers["cookie"]
      ? parse(request.headers["cookie"])
      : {}

    const cookies: Record<string, string> = {}

    for (const cookieKey in cookiesFromHeader) {
      const [key, signature] = cookieKey.split(".")

      if (!!signature !== !!secret) continue
      if (signature && !isValidCookie(key!, signature, secret!)) continue

      cookies[key!] = cookiesFromHeader[cookieKey]!
    }

    return {
      request: { cookies },

      response: {
        setCookie: (key: string, value: string) => {
          const parsedKey = secret
            ? `${key}.${createSignature(secret, key)}`
            : key

          return response.setHeader(
            "Set-Cookie",
            serialize(parsedKey, value, options)
          )
        },
      },
    }
  })
}

function createSignature(secret: string, key: string) {
  let signature = createHmac("sha512", secret).update(key).digest("base64")
  while (signature[signature.length - 1] === "=")
    signature = signature.slice(0, signature.length - 2)
  return signature
}

function isValidCookie(key: string, signature: string, secret: string) {
  const providedSignatureBuffer = Buffer.from(signature)
  const signatureBuffer = Buffer.from(createSignature(secret, key))

  if (providedSignatureBuffer.length !== signatureBuffer.length) return false
  else return timingSafeEqual(providedSignatureBuffer, signatureBuffer)
}
