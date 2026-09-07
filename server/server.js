import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = Number(process.env.PORT || 3001)
const restaurantName = process.env.RESTAURANT_NAME || 'Sunder Sahawas Phase 1'
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2'
const googleReviewUrl = process.env.GOOGLE_REVIEW_URL || 'https://www.google.com/maps/place/Sunder+Sahawas+Phase+1/@18.4734513,73.8143519,17z/data=!4m8!3m7!1s0x3bc29566cf18601d:0x243f9ab233bc3397!8m2!3d18.4734513!4d73.8143519!9m1!1b1!16s%2Fg%2F1jkvgnxc1?entry=ttu&g_ep=EgoyMDI2MDkwMi4wIKXMDSoASAFQAw%3D%3D'
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
)
const requestLog = new Map()
const requestLimit = 10
const requestWindowMs = 60 * 1000
const maxCommentLength = 2000
const maxPlaceNameLength = 120
const unsafeContentPattern = /<script\b|javascript:|ignore (?:all|previous) instructions|system prompt/i

app.disable('x-powered-by')
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Origin is not allowed'))
  },
}))
app.use(express.json({ limit: '16kb' }))

function isRateLimited(ipAddress) {
  const now = Date.now()
  const recentRequests = (requestLog.get(ipAddress) || []).filter(
    (timestamp) => now - timestamp < requestWindowMs,
  )

  recentRequests.push(now)
  requestLog.set(ipAddress, recentRequests)

  return recentRequests.length > requestLimit
}

function normalizeInput(value, maxLength) {
  return Array.from(String(value || ''))
    .filter((character) => {
      const codePoint = character.charCodeAt(0)
      return codePoint >= 32 && codePoint !== 127
    })
    .join('')
    .trim()
    .slice(0, maxLength)
}

function containsUnsafeContent(value) {
  return unsafeContentPattern.test(value)
}

function buildPrompt({ rating, comment, placeName }) {
  const normalizedComment = comment?.trim() || ''
  const audienceName = placeName || restaurantName

  return `You are a review assistant for a cooperative housing society / residential community.
Generate a short, authentic review for ${audienceName} based only on the rating and resident feedback.

Rules:
- Focus on society living experience: maintenance, cleanliness, security, amenities, communication, management, parking, and community environment.
- Do not invent facts, names, incidents, staff names, or events.
- Use the resident's real experience as the source.
- Write 1 to 3 sentences.
- Keep it natural, conversational, and honest.
- Be constructive and respectful.
- Match the tone exactly to the star rating: 1-2 stars should sound disappointed or critical, 3 stars should sound mixed but fair, 4 stars should feel positive with minor concerns, and 5 stars should feel strongly positive and appreciative.
- Never write a review that sounds more positive than the requested rating.
- No emojis, hashtags, or promotional language.
- Do not claim special treatment or fake experiences.
- Do not mention food, restaurant service, dishes, or kitchen staff unless the resident explicitly mentions them.

Customer rating: ${rating} out of 5
Resident feedback: ${normalizedComment || 'No additional comment provided.'}

Output only the final review text.`
}

function buildFallbackReview({ rating, comment }) {
  const reviewTemplates = {
    1: 'The experience did not meet expectations, and there are a few areas that need attention for a better living experience.',
    2: 'The overall experience was mixed, with some positives but a few issues that need improvement.',
    3: 'The society is decent overall, with some good aspects but a few areas that could be improved.',
    4: 'The society is well maintained and generally pleasant, with only a few minor issues that did not affect the overall experience.',
    5: 'The society is well managed, clean, and comfortable, and the overall living experience has been very positive.',
  }

  const base = reviewTemplates[rating] || reviewTemplates[3]
  const extra = comment?.trim() ? ` ${comment.trim()}` : ''
  return `${base}${extra}`.trim()
}

async function generateReviewWithOllama({ rating, comment, placeName }) {
  const response = await fetch(`${ollamaBaseUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: ollamaModel,
      prompt: buildPrompt({ rating, comment, placeName: placeName || restaurantName }),
      stream: false,
      options: {
        temperature: 0.7,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama request failed with status ${response.status}`)
  }

  const data = await response.json()
  const text = normalizeInput(data?.response, maxCommentLength)

  if (!text || text.length < 10 || containsUnsafeContent(text)) {
    throw new Error('Ollama returned an empty review')
  }

  return text
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, restaurantName, ollamaModel, googleReviewUrl })
})

app.post('/api/reviews/generate', async (req, res) => {
  if (isRateLimited(req.ip)) {
    return res.status(429).json({ message: 'Too many requests. Please try again in a minute.' })
  }

  const { rating, comment = '', restaurantName: incomingRestaurantName } = req.body || {}
  const normalizedComment = normalizeInput(comment, maxCommentLength)
  const normalizedRestaurantName = normalizeInput(incomingRestaurantName || restaurantName, maxPlaceNameLength)

  if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5.' })
  }

  if (containsUnsafeContent(normalizedComment) || containsUnsafeContent(normalizedRestaurantName)) {
    return res.status(400).json({ message: 'Please remove unsafe instructions or markup from the feedback.' })
  }

  try {
    const review = await generateReviewWithOllama({
      rating: Number(rating),
      comment: normalizedComment,
      placeName: normalizedRestaurantName,
    })

    return res.json({ review, source: 'ollama', status: 'success' })
  } catch {
    const fallback = buildFallbackReview({
      rating: Number(rating),
      comment: normalizedComment,
    })

    return res.json({
      review: fallback,
      source: 'fallback',
      status: 'success',
      note: 'Ollama unavailable, using local fallback generation.',
    })
  }
})

app.listen(port, () => {
  console.log(`Restaurant review API listening on http://localhost:${port}`)
  console.log(`Ollama base URL: ${ollamaBaseUrl}`)
  console.log(`Ollama model: ${ollamaModel}`)
})
