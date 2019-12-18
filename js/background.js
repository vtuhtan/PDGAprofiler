'use-strict';

const HOVER_TIMEOUT = 300;
const INFO_TIMEOUT = 800;
let hoverTimer;
let infoTimer;

function getProfileAsync(playerId, callback)
{
  let xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function () {
    if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
      callback(xmlHttp.responseText);
  };
  xmlHttp.open('GET', playerId, true);
  xmlHttp.send(null);
}

function getProfileInfo(playerId, profileDiv, x, y) {
  return function() {
    getProfileAsync(playerId, function (playerProfile) {
      let domparser = new DOMParser();
      let doc = domparser.parseFromString(playerProfile, 'text/html');
      let playerInfo = doc.getElementsByClassName("pane-player-player-info")[0].innerHTML;
      let profile = document.getElementById('PDGAprofiler-player-info');
      profile.innerHTML = playerInfo;

      profileDiv.style.cssText = "display: block; top: unset; bottom: " + (innerHeight - y - 10) + "px; left: " + (x + 30) + "px;"; //show tooltip
    });
  }
}

function showPopup(playerId, profileDiv, x, y) {
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(getProfileInfo(playerId, profileDiv, x, y), HOVER_TIMEOUT);
}

function dismissPopup(profileDiv) {
  return function() {
    profileDiv.style.cssText = "display: none;"
  }
}

function addListeners() {

  let profileDiv = document.createElement('div');
  profileDiv.id = 'PDGAprofiler-player-info';
  document.body.appendChild(profileDiv);

  profileDiv.addEventListener("mouseleave", function() {
    infoTimer = setTimeout(dismissPopup(profileDiv), INFO_TIMEOUT);
  });

  profileDiv.addEventListener("mouseenter", function() {
    clearTimeout(infoTimer);
  });

  let links = document.getElementsByTagName('a');

  for (var i=0; i<links.length; i++) {
    if (links[i].pathname.startsWith("/player/")) {
      let player = links[i];
      player.classList.add("PDGAprofiler-player");

      player.addEventListener("mouseenter",function(e) {
        let x  = e.clientX;
        let y = e.clientY;
        showPopup(player.href, profileDiv, x, y);
      });

      player.addEventListener("mouseleave", function(){
        clearTimeout(hoverTimer);
        infoTimer = setTimeout(dismissPopup(profileDiv), INFO_TIMEOUT);
      })
    }
  }
}


addListeners();

