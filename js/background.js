'use-strict';

const HOVER_TIMEOUT = 250;
const INFO_TIMEOUT = 800;
const PDGA_ORIGIN = "https://www.pdga.com";
let hoverTimer;
let infoTimer;

const $ = window.jQuery;

function getProfileInfo(playerId, x, y) {
  return function() {
    playerId = !playerId.startsWith(PDGA_ORIGIN)?PDGA_ORIGIN + playerId.replace('http://www.pdga.com', ''):playerId;

    $.ajax(playerId, {dataType: "html", method: "GET"})
      .done(function (playerProfile) {
        let doc = $(playerProfile);

        //title section
        let playerTitle = doc.find('h1#page-title')[0];
        playerTitle.id = 'PDGAprofiler-player-name';
        $('#PDGAprofiler-player-title').html(DOMPurify.sanitize(playerTitle.outerHTML || ""));

        //photo section
        let playerPhoto = doc.find('div.pane-player-photo-player-photo-pane')[0] || "";
        let photoDiv = $('#PDGAprofiler-player-photo').html(DOMPurify.sanitize(playerPhoto.outerHTML || ""))
        if (playerPhoto && $(playerPhoto).find('img').length>0) {
          photoDiv.addClass('hasPhoto');
        } else {
          photoDiv.removeClass('hasPhoto');
        }

        //player info section
        let playerInfo = doc.find(".pane-player-player-info")[0];
        $('#PDGAprofiler-player-info').html(DOMPurify.sanitize(playerInfo.innerHTML || ""));

        //show tooltip
        let playerTooltip = $('#PDGAprofiler-player');
        playerTooltip.css("display", "block").css("bottom", y).css("top", "unset").css("left", x);
        let offsetY = playerTooltip[0].getBoundingClientRect().y;
        if (offsetY < 0) playerTooltip.css("bottom", y+offsetY);
      })
      .fail(function (error) {
        console.error(error);
      });
  }
}

function showPopup(playerId, x, y) {
  clearTimeout(hoverTimer);
  hoverTimer = setTimeout(getProfileInfo(playerId, x, y), HOVER_TIMEOUT);
}

function dismissPopup(profileDiv) {
  return function() {
    profileDiv.hide();
  }
}

function addListeners() {
  let profileDiv = $('<div/>').attr('id', 'PDGAprofiler-player')
    .append($('<div/>').attr('id', 'PDGAprofiler-player-photo'))
    .append($('<div/>').attr('id', 'PDGAprofiler-player-title'))
    .append($('<div/>').addClass("panel-pane pane-horizontal-rule").append($('<hr/>')))
    .append($('<div/>').attr('id', 'PDGAprofiler-player-info'));
  profileDiv.appendTo(document.body);

  profileDiv
    .on("mouseleave", function() {
      infoTimer = setTimeout(dismissPopup(profileDiv), INFO_TIMEOUT);
    })
    .on("mouseenter", function() {
        clearTimeout(infoTimer);
    });

  let players = $('a[href^="/player/"]');

  for (var i=0; i<players.length; i++) {
    let player = $(players[i]);
    player.addClass("PDGAprofiler-player");
    player
      .on("mouseenter",function(e) {
        clearTimeout(infoTimer);
        let x  = e.clientX + 30;
        let y = $(window).height() - e.clientY - 10;
        showPopup($(this).attr('href'), x, y);
      })
      .on("mouseleave", function(){
        clearTimeout(hoverTimer);
        if (profileDiv.is(':visible')) {
          infoTimer = setTimeout(dismissPopup(profileDiv), INFO_TIMEOUT);
        }
      });
  }
}


addListeners();

