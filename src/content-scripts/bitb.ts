/* eslint-disable complexity */
/* eslint-disable no-global-assign */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable no-script-url */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { browser } from 'webextension-polyfill-ts'

// Random Variable to Identify Script
const r = (Math.random() + 1).toString(36).slice(2)
const r2 = (Math.random() + 1).toString(36).slice(2)
const rid = r + r2

// On load, find all iframes, add styles
function iframeFinder() {
  // Fetch current domain
  let domain = new URL(document.URL).hostname

  // If error / empty string, set to blank
  if (!domain) domain = 'localhost'
  // Get domainAllow array, if exists, check if domain entry exists
  const domainAllow = browser.storage.local.get('domainAllow')
  domainAllow.then((domainAllowResult) => {
    let domainAllowResultP = domainAllowResult.domainAllow

    if (!domainAllowResultP) domainAllowResultP = []

    // If parent domain is NOT allow-listed
    if (!domainAllowResultP.includes(domain)) {
      // Get allowlist array, if exists, check if entry exists
      const srcAllow = browser.storage.local.get('srcAllow')
      srcAllow.then((srcAllowResult) => {
        // If the result in localStorage doesn't exist, set it to empty array []
        let srcAllowResultP = srcAllowResult.srcAllow

        if (!srcAllowResultP) srcAllowResultP = []

        for (const frame of document.querySelectorAll('iframe')) {
          // If the iframe actually has a src attribute set
          // AND if the iframe already doesn't have unique ID
          if (
            !srcAllowResultP.includes(frame.src) &&
            frame.src &&
            frame.src !== 'about:blank' &&
            frame.src !== 'javascript:undefined' &&
            !frame.classList.contains(rid)
          ) {
            // Give it unique ID
            frame.setAttribute('class', rid)

            // Create Warning Div
            const warning = document.createElement('div')
            warning.classList.add('warning-' + rid)

            // IFrame Styles
            frame.style.filter = 'brightness(20%)'

            // Style Warning Div
            warning.style.fontFamily = 'Arial, Helvetica, sans-serif'
            warning.style.fontSize = '14px'

            warning.style.color = 'white'
            warning.style.backgroundColor = 'rgb(206,53,40)'

            warning.style.width = '100%'
            warning.style.padding = '20px'
            warning.style.margin = '0px'
            warning.style.zIndex = '9999'

            warning.style.position = 'fixed'
            warning.style.bottom = '0'
            warning.style.left = '0'

            warning.style.overflow = 'none'
            warning.style.display = 'block'

            // Create Heading and Paragraph and append them
            const warningHeading = document.createElement('h2')
            const warningText = document.createElement('p')
            const warningText2 = document.createElement('p')

            // Format URL (add elipses if too long)
            const warningURL =
              frame.src.length > 50 ? frame.src.slice(0, 50) + '...' : frame.src

            // Create URL element
            const urlElement = document.createElement('span')
            urlElement.textContent = warningURL
            urlElement.title = frame.src

            const warningAccept = document.createElement('button')
            const warningNever = document.createElement('button')

            warningHeading.textContent =
              'Warning: Potential Security Risk Ahead'
            warningText.textContent =
              'An iframe element is displaying content from the following URL: '
            warningText2.textContent =
              'Please ensure you trust this URL before entering any sensitive information such as passwords, emails, or credit card details.'

            warningAccept.textContent = 'Close Warning'
            warningNever.title = domain
            warningNever.textContent = 'Never Show Warnings On This Site'

            // Style Heading H2
            warningHeading.style.fontFamily = 'Arial, Helvetica, sans-serif'
            warningHeading.style.color = 'white'

            warningHeading.style.fontSize = '18px'
            warningHeading.style.fontWeight = 'normal'

            warningHeading.style.margin = '0px'
            warningHeading.style.marginBottom = '15px'
            warningHeading.style.padding = '0px'

            // Style Parageaph p
            warningText.style.fontFamily = 'Arial, Helvetica, sans-serif'
            warningText.style.color = 'white'

            warningText.style.fontSize = '14px'
            warningText.style.fontWeight = 'normal'

            warningText.style.margin = '0px'
            warningText.style.marginRight = '5px'
            warningText.style.marginBottom = '15px'
            warningText.style.padding = '0px'

            warningText.style.display = 'inline-block'

            // Style URLElement
            urlElement.style.fontFamily = 'Arial, Helvetica, sans-serif'
            urlElement.style.fontWeight = 'bold'
            urlElement.style.textDecoration = 'underline'
            urlElement.style.color = 'white'

            urlElement.style.fontSize = '14px'

            urlElement.style.margin = '0px'
            urlElement.style.marginBottom = '15px'
            urlElement.style.padding = '0px'

            urlElement.style.display = 'inline-block'

            // Style Parageaph 2 p
            warningText2.style.fontFamily = 'Arial, Helvetica, sans-serif'
            warningText2.style.color = 'white'

            warningText2.style.fontSize = '14px'
            warningText2.style.fontWeight = 'normal'

            warningText2.style.margin = '0px'
            warningText2.style.marginBottom = '15px'
            warningText2.style.padding = '0px'

            // Style Accept Button
            warningAccept.style.fontFamily = 'Arial, Helvetica, sans-serif'
            warningAccept.style.color = 'black'

            warningAccept.style.fontSize = '14px'
            warningAccept.style.fontWeight = 'normal'

            warningAccept.style.background = 'none'
            warningAccept.style.backgroundColor = 'white'
            warningAccept.style.border = 'none'
            warningAccept.style.borderRadius = '5px'

            warningAccept.style.marginTop = '2px'
            warningAccept.style.padding = '10px'
            warningAccept.style.display = 'inline-block'
            warningAccept.style.cursor = 'pointer'

            warningAccept.style.marginRight = '10px'

            // Style Never Button
            warningNever.style.fontFamily = 'Arial, Helvetica, sans-serif'
            warningNever.style.color = 'white'

            warningNever.style.fontSize = '14px'
            warningNever.style.fontWeight = 'normal'

            warningNever.style.background = 'none'
            warningNever.style.border = 'solid 1px white'
            warningNever.style.borderRadius = '5px'

            warningNever.style.marginTop = '2px'
            warningNever.style.padding = '10px'
            warningNever.style.display = 'inline-block'
            warningNever.style.cursor = 'pointer'

            // Append Heading and Paragraph to warning element
            warning.append(warningHeading)
            warning.append(warningText)
            warning.append(urlElement)
            warning.append(warningText2)

            warning.append(warningAccept)
            warning.append(warningNever)

            // Append warning to document
            document.body.append(warning)

            // Event listener for Accept warning button
            warningAccept.addEventListener('click', (e) => {
              e.preventDefault()

              // Remove warning
              warning.remove()

              // IFrame Styles
              frame.style.filter = 'brightness(100%)'
              frame.style.filter = 'initial'

              // Add src URL to whitelist array
              if (srcAllowResultP) {
                // Check if entry for frame src exists
                if (!srcAllowResultP.includes(frame.src)) {
                  srcAllowResultP.push(frame.src)
                  browser.storage.local.set({ srcAllow: srcAllowResultP })
                }
              } else {
                // Create array and push frame src to it
                const srcAllowArray = [frame.src]
                browser.storage.local.set({ srcAllow: srcAllowArray })
              }
            })

            // Event listener for Never Warning button
            warningNever.addEventListener('click', (e) => {
              e.preventDefault()

              // Remove all warnings
              for (const warningDiv of document.querySelectorAll(
                'div.warning-' + rid
              ))
                warningDiv.remove()

              // IFrame Styles
              frame.style.filter = 'brightness(100%)'
              frame.style.filter = 'initial'

              // Add parent URL to domainAllow array
              if (domainAllowResultP) {
                // Check if entry for frame src exists
                if (!domainAllowResultP.includes(domain)) {
                  domainAllowResultP.push(domain)
                  browser.storage.local.set({ domainAllow: domainAllowResultP })
                }
              } else {
                // Create array and push frame src to it
                const domainAllowArray = [domain]
                browser.storage.local.set({ domainAllow: domainAllowArray })
              }
            })
          }
        } // End of forEach frame
      }) // End of srcAllow
    } // End of if domainAllow
  }) // End of domainAllow
}

// Call this whenever DOM updates
iframeFinder()

export { iframeFinder }

// Mutation Observer
/// /////////////////////////////////////////////
MutationObserver = window.MutationObserver ?? window.MutationObserver

const observer = new MutationObserver((_mutations, _observer) => {
  iframeFinder()
})

// Define what element should be observed by the observer
// and what types of mutations trigger the callback
observer.observe(document, {
  subtree: true,
  attributes: true,
})
/// ////////////////////////////////////////////
