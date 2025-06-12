export const getURL = (path: string = '') => {
  // Check if NEXT_PUBLIC_SITE_URL is set and non-empty. Set this to your site URL in production env.
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL &&
    process.env.NEXT_PUBLIC_SITE_URL.trim() !== ''
      ? process.env.NEXT_PUBLIC_SITE_URL
      : // If not set, check for NEXT_PUBLIC_VERCEL_URL, which is automatically set by Vercel.
        process?.env?.NEXT_PUBLIC_VERCEL_URL &&
          process.env.NEXT_PUBLIC_VERCEL_URL.trim() !== ''
        ? process.env.NEXT_PUBLIC_VERCEL_URL
        : // If neither is set, default to localhost for development.
          'http://localhost:3000/'

  // Trim the URL and remove trailing slash if exists.
  url = url.replace(/\/+$/, '')
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`
  // Ensure path starts without a slash to avoid double slashes.
  path = path.replace(/^\/+/, '')

  return path ? `${url}/${path}` : url
}

export const toDateTime = (secs: number) => {
  const t = new Date(+0) // Unix epoch start.
  t.setSeconds(secs) // Add seconds.
  return t
}

export const calculateTrialEndUnixTimestamp = (
  trialPeriodDays: number | null | undefined
) => {
  // Check if trialPeriodDays is null, undefined, or less than 2 days
  if (
    trialPeriodDays === null ||
    trialPeriodDays === undefined ||
    trialPeriodDays < 2
  ) {
    return undefined
  }

  const currentDate = new Date() // Current date and time
  const trialEnd = new Date(
    currentDate.getTime() + (trialPeriodDays + 1) * 24 * 60 * 60 * 1000
  ) // Add trial days
  return Math.floor(trialEnd.getTime() / 1000) // Convert to Unix timestamp in seconds
}

export const getErrorRedirect = (
  path: string,
  errorHeading: string,
  errorMessage: string
) => {
  return `/error?path=${encodeURIComponent(
    path
  )}&error=${encodeURIComponent(errorHeading)}&message=${encodeURIComponent(errorMessage)}`
}

export const getRedirectToErrorPage = (
  redirectPath: string,
  errorMessage: string
) => {
  const params = new URLSearchParams()
  params.append('error', errorMessage)
  return `/error?${params.toString()}`
}

export const getRedirectToSuccessPage = (
  redirectPath: string,
  successMessage: string
) => {
  const params = new URLSearchParams()
  params.append('message', successMessage)
  return `${redirectPath}?${params.toString()}`
}
