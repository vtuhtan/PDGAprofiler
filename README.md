# PDGA Profiler
Get player info by hovering player's name

![PDGA Profiler on tournament page](screenshots/PDGAprofiler_tournament.png?raw=true "PDGA Profiler - Tournament Page")

## Installation
* Chrome: [PDGA Profiler Extension](https://chrome.google.com/webstore/detail/pdga-profiler/icgfcpkalamdllnmkjlhockaanelkkck) 
* Firefox: [PDGA Profiler Addon](https://addons.mozilla.org/en-US/firefox/addon/pdga-profiler/)
* Edge: [PDGA Profiler Extension]https://microsoftedge.microsoft.com/addons/detail/pdga-profiler/gakojkeknnicgnfdacnhamkbgikbgjda)
---
* Source Code: [PDGA Profiler Github](https://github.com/vtuhtan/PDGAprofiler)

## Description
Get player info by hovering player's name on any pdga.com page.

Have you ever wanted to know more about PDGA member from a tournament page? Find out more about it's membership, rating and events just by hovering the name.
This extension helps disc golfers find more about their next opponent, friend or just a random PDGA member.

## Browser Compatibility
* Chrome 88+ (Manifest V3 support)
* Firefox 142+ (Manifest V3 support)

## Version History
* 1.0.1 - **Manifest V3 Migration**
  - Migrated from Manifest V2 to Manifest V3 for modern browser compatibility
  - Removed jQuery dependency - now uses vanilla JavaScript for better performance
  - Replaced jQuery AJAX with modern Fetch API
  - Reduced JavaScript bundle size by 97% (from 89KB to 3KB)
  - Improved code quality with ES6+ features and better error handling
  - All existing functionality preserved (hover behavior, popup display, timing)
* 0.3.4 - Fixed image sizing
* 0.3.3 - Added maximum width constraint. Player profile disabled for tab navigation on profile page.
* 0.3.2 - Fixed the issue when tooltip is cut by the top of the page
* 0.3.1 - Included Player name and profile picture. Improved stability. jQuery for code readability
* 0.2 - First deployed version, included purify.js
* 0.1 - Initial release



