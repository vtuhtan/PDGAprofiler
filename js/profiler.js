'use strict';

/**
 * PDGA Profiler - Content Script
 * Displays player profile information in a popup when hovering over player links
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Delay in milliseconds before showing the popup after hovering over a player link.
 * This prevents the popup from appearing during quick mouse movements across the page.
 * @constant {number}
 */
const HOVER_TIMEOUT = 250;

/**
 * Delay in milliseconds before hiding the popup after the mouse leaves.
 * This gives users time to move their cursor to the popup itself if they want to
 * interact with it or read more information.
 * @constant {number}
 */
const INFO_TIMEOUT = 800;

/**
 * Base URL for PDGA.com website.
 * Used for normalizing relative player URLs to absolute URLs.
 * @constant {string}
 */
const PDGA_ORIGIN = "https://www.pdga.com";

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * Timer ID for the hover delay before showing the popup.
 * Cleared when mouse leaves the link before timeout completes.
 * @type {number|null}
 */
let hoverTimer = null;

/**
 * Timer ID for the delay before hiding the popup.
 * Cleared when mouse enters the popup or another player link.
 * @type {number|null}
 */
let infoTimer = null;

// ============================================================================
// PROFILE FETCHING
// ============================================================================

/**
 * Fetches player profile HTML from PDGA.com
 * @param {string} playerId - Player URL or ID (can be relative or absolute)
 * @returns {Promise<string>} HTML content of player profile page
 * @throws {Error} If the fetch fails or returns a non-OK status
 */
async function fetchPlayerProfile(playerId) {
  // Normalize URL to absolute PDGA.com URL
  // Handles both relative URLs (/player/12345) and absolute URLs
  const profileUrl = playerId.startsWith(PDGA_ORIGIN) 
    ? playerId 
    : PDGA_ORIGIN + playerId.replace('http://www.pdga.com', '');
  
  try {
    const response = await fetch(profileUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Failed to fetch player profile:', error);
    throw error;
  }
}

// ============================================================================
// PROFILE PARSING
// ============================================================================

/**
 * Parses player profile HTML and extracts relevant data
 * @param {string} htmlString - Raw HTML from player profile page
 * @returns {Object} Parsed player data
 * @returns {string} returns.title - Player name/title HTML
 * @returns {string} returns.photo - Player photo HTML
 * @returns {boolean} returns.hasPhoto - Whether player has a photo
 * @returns {string} returns.info - Player info sections HTML
 */
function parsePlayerProfile(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  
  // Extract player title (name and PDGA number)
  const playerTitle = doc.querySelector('h1#page-title');
  if (playerTitle) {
    // Change ID to avoid conflicts with existing page elements
    playerTitle.id = 'PDGAprofiler-player-name';
  }
  
  // Extract player photo section
  const playerPhoto = doc.querySelector('div.pane-player-photo-player-photo-pane');
  // Check if photo actually contains an image (some players don't have photos)
  const hasPhoto = playerPhoto && playerPhoto.querySelector('img') !== null;
  
  // Extract player info (rating, location, member since, etc.)
  const playerInfo = doc.querySelector('.pane-player-player-info');
  
  // Return structured data with empty strings as fallbacks for missing elements
  return {
    title: playerTitle ? playerTitle.outerHTML : '',
    photo: playerPhoto ? playerPhoto.outerHTML : '',
    hasPhoto: hasPhoto,
    info: playerInfo ? playerInfo.innerHTML : ''
  };
}

// ============================================================================
// POPUP CONTENT MANAGEMENT
// ============================================================================

/**
 * Updates popup content with player profile data.
 * All content is sanitized with DOMPurify to prevent XSS attacks.
 * @param {Object} profileData - Parsed player data from parsePlayerProfile()
 */
function updatePopupContent(profileData) {
  const photoDiv = document.getElementById('PDGAprofiler-player-photo');
  const titleDiv = document.getElementById('PDGAprofiler-player-title');
  const infoDiv = document.getElementById('PDGAprofiler-player-info');
  
  // Sanitize and inject content to prevent XSS attacks
  // DOMPurify removes potentially dangerous HTML/JavaScript
  titleDiv.innerHTML = DOMPurify.sanitize(profileData.title);
  photoDiv.innerHTML = DOMPurify.sanitize(profileData.photo);
  infoDiv.innerHTML = DOMPurify.sanitize(profileData.info);
  
  // Add/remove CSS class based on photo availability
  // This allows different styling for players with/without photos
  if (profileData.hasPhoto) {
    photoDiv.classList.add('hasPhoto');
  } else {
    photoDiv.classList.remove('hasPhoto');
  }
}

// ============================================================================
// POPUP POSITIONING
// ============================================================================

/**
 * Positions popup relative to cursor with edge detection.
 * The popup is positioned to the right and below the cursor, with automatic
 * adjustment if it would extend beyond the top of the viewport.
 * @param {number} x - X coordinate for popup (pixels from left edge)
 * @param {number} y - Y coordinate for popup (pixels from bottom edge)
 */
function positionPopup(x, y) {
  const popup = document.getElementById('PDGAprofiler-player');
  
  // Initial positioning: offset from cursor to avoid blocking the link
  popup.style.display = 'block';
  popup.style.bottom = `${y}px`;  // Position from bottom of viewport
  popup.style.top = 'unset';      // Clear any previous top positioning
  popup.style.left = `${x}px`;    // Position from left of viewport
  
  // Edge detection: adjust if popup extends above viewport
  // getBoundingClientRect() gives us the actual rendered position
  const rect = popup.getBoundingClientRect();
  if (rect.y < 0) {
    // Popup extends above viewport, shift it down by the overflow amount
    popup.style.bottom = `${y + rect.y}px`;
  }
}

// ============================================================================
// POPUP DISPLAY CONTROL
// ============================================================================

/**
 * Fetches and displays player profile in popup.
 * This is the main orchestration function that coordinates fetching,
 * parsing, and displaying the player profile.
 * @param {string} playerId - Player URL or ID
 * @param {number} x - X coordinate for popup positioning
 * @param {number} y - Y coordinate for popup positioning
 */
async function getProfileInfo(playerId, x, y) {
  try {
    const html = await fetchPlayerProfile(playerId);
    const profileData = parsePlayerProfile(html);
    updatePopupContent(profileData);
    positionPopup(x, y);
  } catch (error) {
    console.error('Error displaying player profile:', error);
    // Graceful degradation: popup simply doesn't appear on error
    // This prevents the extension from breaking the page if PDGA.com is down
  }
}

/**
 * Shows popup after hover timeout delay.
 * Clears any existing hover timer to prevent multiple popups.
 * @param {string} playerId - Player URL or ID
 * @param {number} x - X coordinate for popup positioning
 * @param {number} y - Y coordinate for popup positioning
 */
function showPopup(playerId, x, y) {
  // Clear any existing hover timer to prevent race conditions
  clearTimeout(hoverTimer);
  
  // Set new timer to show popup after HOVER_TIMEOUT
  hoverTimer = setTimeout(() => {
    getProfileInfo(playerId, x, y);
  }, HOVER_TIMEOUT);
}

/**
 * Hides the popup by setting display to none.
 */
function dismissPopup() {
  const popup = document.getElementById('PDGAprofiler-player');
  popup.style.display = 'none';
}

// ============================================================================
// DOM INITIALIZATION
// ============================================================================

/**
 * Creates the popup DOM structure.
 * The popup contains sections for photo, title, separator, and info.
 * @returns {HTMLElement} The complete popup element ready to be appended to the DOM
 */
function createPopupElement() {
  const popup = document.createElement('div');
  popup.id = 'PDGAprofiler-player';
  
  // Photo section (may be empty if player has no photo)
  const photoDiv = document.createElement('div');
  photoDiv.id = 'PDGAprofiler-player-photo';
  
  // Title section (player name and PDGA number)
  const titleDiv = document.createElement('div');
  titleDiv.id = 'PDGAprofiler-player-title';
  
  // Horizontal separator between title and info
  const separator = document.createElement('div');
  separator.className = 'panel-pane pane-horizontal-rule';
  separator.innerHTML = '<hr/>';
  
  // Info section (rating, location, member since, etc.)
  const infoDiv = document.createElement('div');
  infoDiv.id = 'PDGAprofiler-player-info';
  
  // Assemble popup structure
  popup.appendChild(photoDiv);
  popup.appendChild(titleDiv);
  popup.appendChild(separator);
  popup.appendChild(infoDiv);
  
  return popup;
}

// ============================================================================
// EVENT LISTENER SETUP
// ============================================================================

/**
 * Attaches event listeners to player links and popup.
 * This is the main initialization function that sets up all interactivity.
 * 
 * Process:
 * 1. Creates and injects the popup element into the page
 * 2. Attaches hover handlers to the popup itself
 * 3. Finds all valid player links on the page
 * 4. Attaches hover handlers to each player link
 */
function attachPlayerListeners() {
  // Create and inject popup element into page
  const popup = createPopupElement();
  document.body.appendChild(popup);
  
  // Popup hover handlers: keep popup visible when hovering over it
  popup.addEventListener('mouseenter', () => {
    // Cancel any pending dismissal when mouse enters popup
    clearTimeout(infoTimer);
  });
  
  popup.addEventListener('mouseleave', () => {
    // Start dismissal timer when mouse leaves popup
    infoTimer = setTimeout(dismissPopup, INFO_TIMEOUT);
  });
  
  // Find all links that start with /player/
  const allPlayerLinks = document.querySelectorAll('a[href^="/player/"]');
  
  // Filter to valid player profile links
  // Excludes: "Player Statistics" links and non-profile URLs
  const playerLinks = Array.from(allPlayerLinks).filter(link => {
    // Match pattern: /player/{number} or /player/{number}/
    // Excludes: /player/{number}/stats, /player/{number}/details, etc.
    const isPlayerPage = /\/player\/\d+\/?(?!\S)/g.test(link.pathname);
    
    // Exclude "Player Statistics" links (these are navigation links, not player profiles)
    const isNotStatistics = link.textContent.toUpperCase() !== 'PLAYER STATISTICS';
    
    return isPlayerPage && isNotStatistics;
  });
  
  // Attach event listeners to each valid player link
  playerLinks.forEach(link => {
    // Add class for potential CSS styling
    link.classList.add('PDGAprofiler-player');
    
    // Show popup on hover
    link.addEventListener('mouseenter', (e) => {
      // Cancel any pending dismissal
      clearTimeout(infoTimer);
      
      // Calculate popup position relative to cursor
      // Offset: 30px right, 10px below cursor
      const x = e.clientX + 30;
      const y = window.innerHeight - e.clientY - 10;  // Convert to bottom-relative
      
      // Trigger popup display with hover delay
      showPopup(link.getAttribute('href'), x, y);
    });
    
    // Handle mouse leaving the link
    link.addEventListener('mouseleave', () => {
      // Cancel any pending popup display
      clearTimeout(hoverTimer);
      
      // If popup is already visible, start dismissal timer
      const popup = document.getElementById('PDGAprofiler-player');
      if (popup.style.display === 'block') {
        infoTimer = setTimeout(dismissPopup, INFO_TIMEOUT);
      }
    });
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the extension when the DOM is ready.
 * Handles both cases: script loading before or after DOMContentLoaded event.
 */
if (document.readyState === 'loading') {
  // DOM is still loading, wait for DOMContentLoaded event
  document.addEventListener('DOMContentLoaded', attachPlayerListeners);
} else {
  // DOM is already loaded, initialize immediately
  attachPlayerListeners();
}
