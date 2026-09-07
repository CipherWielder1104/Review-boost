import { useEffect, useMemo, useState } from 'react'
import './App.css'

const defaultReview = 'The society is generally well maintained and the overall living experience has been positive. A few areas still need attention, but the environment feels safe, clean, and comfortable.'
const restaurantName = import.meta.env.VITE_RESTAURANT_NAME || 'Sunder Sahawas Phase 1'
const googleReviewUrl = import.meta.env.VITE_GOOGLE_REVIEW_URL || 'https://www.google.com/maps/place/Sunder+Sahawas+Phase+1/@18.4734513,73.8143519,17z/data=!4m8!3m7!1s0x3bc29566cf18601d:0x243f9ab233bc3397!8m2!3d18.4734513!4d73.8143519!9m1!1b1!16s%2Fg%2F1jkvgnxc1?entry=ttu&g_ep=EgoyMDI2MDkwMi4wIKXMDSoASAFQAw%3D%3D'
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function App() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedRating, setSelectedRating] = useState(0)
  const [comment, setComment] = useState('')
  const [generatedReview, setGeneratedReview] = useState(defaultReview)
  const [googleReview, setGoogleReview] = useState(defaultReview)
  const [isReviewLocked, setIsReviewLocked] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [photoName, setPhotoName] = useState('')

  const progress = useMemo(() => ((currentStep + 1) / 10) * 100, [currentStep])

  useEffect(() => {
    if (!googleClientId || !window.google?.accounts?.id) {
      return
    }

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: () => {
        // Keep the Google integration optional. The review page still opens directly
        // so users are not blocked by a false sign-in state on their browser.
      },
    })
  }, [])

  const getStars = (count) => Array.from({ length: 5 }, (_, index) => index < count)

  const renderStars = (count, extraClassName = '') => (
    <div className={`stars ${extraClassName}`.trim()}>
      {getStars(count).map((filled, index) => (
        <span key={`star-${count}-${index}`} className={filled ? 'filled' : ''}>★</span>
      ))}
    </div>
  )

  const generateReview = async () => {
    setIsReviewLocked(false)

    try {
      const response = await fetch('/api/reviews/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: selectedRating,
          comment,
          restaurantName,
        }),
      })

      const data = await response.json()
      const reviewText = data.review || defaultReview

      setGeneratedReview(reviewText)
      setGoogleReview(reviewText)
      setCurrentStep(3)
    } catch {
      setGeneratedReview(defaultReview)
      setGoogleReview(defaultReview)
      setCurrentStep(3)
    }
  }

  const copyToClipboard = async (text) => {
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
    } catch (error) {
      console.warn('Clipboard access unavailable', error)
    }
  }

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (selectedPhoto?.startsWith('blob:')) {
      URL.revokeObjectURL(selectedPhoto)
    }

    setSelectedPhoto(URL.createObjectURL(file))
    setPhotoName(file.name)
    event.target.value = ''
  }

  const handleGoogleLogin = async (shouldAdvance = false) => {
    await copyToClipboard(generatedReview)

    const openReviewPage = () => {
      const newWindow = window.open(googleReviewUrl, '_blank', 'noopener,noreferrer')
      if (!newWindow) {
        window.location.href = googleReviewUrl
      }
    }

    if (googleClientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          openReviewPage()
          return
        }

        openReviewPage()
      })
      if (shouldAdvance) {
        setCurrentStep(7)
      }
      return
    }

    openReviewPage()
    if (shouldAdvance) {
      setCurrentStep(7)
    }
  }

  const goBack = () => {
    if (currentStep >= 4) {
      return
    }

    setCurrentStep((step) => Math.max(0, step - 1))
  }

  const lockReview = async () => {
    await copyToClipboard(generatedReview)
    setIsReviewLocked(true)
  }

  const goNext = async () => {
    if (currentStep === 1) {
      setCurrentStep(2)
      await generateReview()
      return
    }

    if (currentStep === 2) {
      setIsReviewLocked(false)
      setCurrentStep(3)
      return
    }

    if (currentStep === 3) {
      if (isReviewLocked) {
        await handleGoogleLogin(false)
        return
      }

      await lockReview()
      return
    }

    if (currentStep === 4) {
      await handleGoogleLogin(true)
      return
    }

    if (currentStep === 7) {
      setCurrentStep(8)
      return
    }

    if (currentStep === 8) {
      setCurrentStep(9)
      return
    }

    setCurrentStep((step) => Math.min(9, step + 1))
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <div className="intro-panel">
              <div className="store-card">
                <div className="store-icon">⌂</div>
                <div className="store-text">
                  <strong>{restaurantName}</strong>
                  <p>We value your honest feedback.</p>
                  <p>Share a quick review to help improve the experience for everyone.</p>
                </div>
              </div>
            </div>
            <div className="feature-strip">
              <span>Verified place</span>
              <span>Quick review</span>
              <span>AI assisted</span>
            </div>
            <div className="progress-wrap">
              <div className="progress-line">
                <span style={{ width: `${progress}%` }} />
              </div>
              <div className="progress-value">{Math.round(progress)}%</div>
            </div>
            <button type="button" className="primary-button" onClick={goNext}>
              Share your review
            </button>
          </>
        )
      case 1:
        return (
          <>
            <div className="stars large" aria-label="Rate your experience">
              {getStars(selectedRating).map((filled, index) => (
                <button
                  key={`star-${index}`}
                  type="button"
                  className={`star-button ${filled ? 'filled' : ''}`}
                  onClick={() => setSelectedRating(index + 1)}
                  aria-label={`Rate ${index + 1} star${index + 1 > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
            </div>

            <div className="detail-block">
              <div className="step-subtitle">Additional comments</div>
              <textarea
                className="feedback-textarea"
                placeholder="Additional comments..."
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />

              <div className="attachment-box">
                <label className="upload-button" htmlFor="review-photo">
                  <input id="review-photo" type="file" accept="image/*" onChange={handlePhotoUpload} />
                  Add photo
                </label>
                {photoName ? <span className="file-name">{photoName}</span> : <span className="file-name muted">Optional</span>}
              </div>

              {selectedPhoto ? (
                <div className="photo-preview-wrap">
                  <img src={selectedPhoto} alt="Review attachment" className="photo-preview" />
                  <div className="preview-actions">
                    <button type="button" className="remove-photo-button" onClick={() => {
                      if (selectedPhoto?.startsWith('blob:')) {
                        URL.revokeObjectURL(selectedPhoto)
                      }
                      setSelectedPhoto(null)
                      setPhotoName('')
                    }}>
                      Remove
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            <button type="button" className="primary-button next" onClick={goNext} disabled={!selectedRating}>
              Generate review
            </button>
          </>
        )
      case 2:
        return (
          <>
            <div className="review-box loading-box">
              <div className="loading-indicator">
                <span />
                <span />
                <span />
              </div>
            </div>
          </>
        )
      case 3:
        return (
          <>
            <div className="review-box">
              {renderStars(selectedRating, 'large')}
              <textarea
                className="feedback-textarea small"
                value={generatedReview}
                onChange={(event) => setGeneratedReview(event.target.value)}
                readOnly={isReviewLocked}
                disabled={isReviewLocked}
              />
              <div className="photo-box">
                {selectedPhoto ? (
                  <img src={selectedPhoto} alt="Attached review photo" className="generated-photo" />
                ) : (
                  <div className="generated-photo-empty">
                    {isReviewLocked ? 'No photo attached' : 'Photo preview will appear here'}
                  </div>
                )}
              </div>
            </div>
            <div className="button-row">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  if (isReviewLocked) {
                    setIsReviewLocked(false)
                    return
                  }

                  goBack()
                }}
              >
                {isReviewLocked ? 'Edit' : 'Back'}
              </button>
              <button type="button" className="primary-button" onClick={goNext}>
                {isReviewLocked ? 'Continue to Google ↗' : 'Save & continue'}
              </button>
            </div>
          </>
        )
      case 4:
        return (
          <>
            <div className="success-badge">✓</div>
            <p className="success-text">Your review is saved.</p>
            <p className="subtle-text">The review is locked in. You can now proceed to Google Maps and post it manually.</p>
            <button type="button" className="primary-button next" onClick={goNext}>
              Proceed to Google ↗
            </button>
          </>
        )
      case 5:
        return (
          <>
            {renderStars(selectedRating, 'large small-stars')}
            <div className="success-badge">✓</div>
            <p className="success-text">Review copied!</p>
            <p className="subtle-text">Your review is copied to your clipboard. Click “Write a review” on Google Maps, paste it, and publish.</p>
            <button type="button" className="primary-button next" onClick={goNext}>
              Open Google review page
            </button>
          </>
        )
      case 7:
        return (
          <>
            <div className="google-header">google.com</div>
            <div className="google-card">
              <div className="google-card-top">
                <span className="google-icon">G</span>
                <div>
                  <strong>{restaurantName}</strong>
                  <small>Google Maps integration</small>
                </div>
              </div>
              <div className="google-review-box">
                {renderStars(selectedRating, 'large')}
                <p>Once the page opens, click “Write a review”, paste your copied review, and publish.</p>
              </div>
              <button type="button" className="primary-button next" onClick={() => window.open(googleReviewUrl, '_blank', 'noopener,noreferrer')}>
                Open review page
              </button>
            </div>
          </>
        )
      case 8:
        return (
          <>
            <div className="google-header">google.com</div>
            <div className="google-card">
              <div className="google-card-top">
                <span className="google-icon">G</span>
                <div>
                  <strong>{restaurantName}</strong>
                  <small>Final review</small>
                </div>
              </div>
              <div className="stars large muted">
                {getStars(selectedRating).map((filled, index) => (
                  <span key={`google-star-${index}`} className={filled ? 'filled' : ''}>★</span>
                ))}
              </div>
              <textarea
                className="feedback-textarea review-input"
                value={googleReview}
                onChange={(event) => setGoogleReview(event.target.value)}
              />
              <button type="button" className="primary-button next" onClick={goNext}>
                Finish
              </button>
            </div>
          </>
        )
      case 9:
        return (
          <>
            <div className="success-card">
              <div className="success-badge final">✓</div>
              <p className="final-copy">Your review flow is complete for {restaurantName}.</p>
            </div>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="page-shell">
      <section className="customer-flow">
        <div className="section-header">CUSTOMER FLOW (Mobile)</div>

        <div className="flow-card">
          <div className="card-top">
            <button type="button" className="back-button" onClick={goBack} disabled={currentStep === 0 || currentStep >= 4} aria-label="Back">
              ←
            </button>
            <div className="header-spacer" />
            {currentStep === 0 ? <div className="agent-pill">Review Agent</div> : null}
          </div>

          <div className="card-title-row">
            <h2>
              {currentStep === 9
                ? 'Review completed'
                : currentStep === 0
                  ? 'Review us'
                  : currentStep === 1
                    ? 'Rate your experience'
                    : currentStep === 2
                      ? 'Generating review'
                      : currentStep === 3
                        ? (isReviewLocked ? 'Review ready' : 'Recommended review')
                        : currentStep === 4
                          ? 'Review ready'
                          : currentStep === 5
                            ? 'Almost there'
                            : currentStep === 6
                              ? 'Google handoff'
                              : 'Google review page'}
            </h2>
          </div>

          <div className="card-body">{renderStep()}</div>
        </div>
      </section>
    </div>
  )
}

export default App
