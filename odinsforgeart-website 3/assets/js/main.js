/* ============================================================
   Jeff Ing | Tattoo Artist — odinsforgeart.com
   Shared site JS: mobile nav, gallery rendering, filters, FAQ,
   and fetch-based loading of /content/*.json (editable via the
   Decap CMS admin panel at /admin).

   HOW TO EDIT CONTENT NOW:
   Log into odinsforgeart.com/admin and edit through the forms —
   changes save as commits and the site rebuilds automatically.
   You should not need to touch the JSON files by hand once the
   CMS is connected. (They still work as plain files if you ever
   want to edit them directly.)
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
  }

  // Load site-wide settings (social links, contact info, address) into
  // any element with a matching data-field attribute.
  applySettings();
});

/**
 * Fetches a JSON file from /content and returns a Promise.
 * Resolves to null (and logs a warning) if the fetch fails, so pages
 * degrade gracefully instead of breaking if a file is missing.
 */
function fetchJSON(path) {
  return fetch(path)
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load ' + path);
      return res.json();
    })
    .catch(function (err) {
      console.warn(err);
      return null;
    });
}

/**
 * Loads content/settings.json and fills in any element with a
 * data-field="<key>" attribute. Works on <a href>, and text content
 * for everything else.
 */
function applySettings() {
  fetchJSON('content/settings.json').then(function (settings) {
    if (!settings) return;

    document.querySelectorAll('[data-field]').forEach(function (el) {
      var key = el.getAttribute('data-field');
      var value = settings[key];
      if (value === undefined || value === null || value === '') return;

      if (el.tagName === 'A' && (key.endsWith('_url') || key === 'booking_email')) {
        el.href = key === 'booking_email' ? 'mailto:' + value : value;
        if (el.hasAttribute('data-field-text')) el.textContent = value;
      } else {
        el.textContent = value;
      }
    });
  });
}

/**
 * Renders a gallery grid of pieces into a container.
 * @param {string} containerId - id of the element to render into
 * @param {Array} items - array of {title, style, price, status, img, note}
 */
function renderGallery(containerId, items) {
  var container = document.getElementById(containerId);
  if (!container || !items) return;

  container.innerHTML = items.map(function (item) {
    var imgBlock = item.img
      ? '<img src="' + item.img + '" alt="' + item.title + '">'
      : '<div class="placeholder-label">Add photo:<br>' + (item.imgHint || item.title) + '</div>';

    var statusTag = item.status
      ? '<span class="tag status-' + item.status + '">' + item.status + '</span>'
      : '';
    var styleTag = item.style ? '<span class="tag">' + item.style + '</span>' : '';
    var priceLine = item.price ? '<div class="price">' + item.price + '</div>' : '';
    var noteLine = item.note ? '<p style="margin-top:0.5rem;font-size:0.85rem;">' + item.note + '</p>' : '';

    return (
      '<div class="piece-card" data-style="' + (item.style || '') + '">' +
        '<div class="piece-img">' + imgBlock + '</div>' +
        '<div class="piece-body">' +
          '<h3>' + item.title + '</h3>' +
          noteLine +
          priceLine +
          '<div class="piece-meta">' + styleTag + statusTag + '</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}

/**
 * Fetches a gallery JSON file and renders it into containerId.
 * @param {string} jsonPath - e.g. "content/flash.json"
 * @param {string} containerId
 */
function loadGallery(jsonPath, containerId) {
  fetchJSON(jsonPath).then(function (data) {
    if (data && data.items) renderGallery(containerId, data.items);
  });
}

/**
 * Wires up filter buttons (elements with [data-filter]) to show/hide
 * .piece-card elements in a gallery grid based on data-style match.
 * @param {string} gridId
 * @param {string} filterRowId
 */
function initGalleryFilters(gridId, filterRowId) {
  var row = document.getElementById(filterRowId);
  if (!row) return;
  row.addEventListener('click', function (e) {
    var btn = e.target.closest('.filter-btn');
    if (!btn) return;
    row.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');

    var filter = btn.getAttribute('data-filter');
    var grid = document.getElementById(gridId);
    grid.querySelectorAll('.piece-card').forEach(function (card) {
      var match = filter === 'all' || card.getAttribute('data-style') === filter;
      card.style.display = match ? '' : 'none';
    });
  });
}

/**
 * Fetches content/faq.json and renders an accordion into containerId.
 * Uses event delegation so it works even though items are added
 * to the page after load (rather than attaching listeners per-item).
 * @param {string} containerId
 */
function loadFAQ(containerId) {
  var container = document.getElementById(containerId);
  if (!container) return;

  fetchJSON('content/faq.json').then(function (data) {
    if (!data || !data.items) return;

    container.innerHTML = data.items.map(function (item, i) {
      return (
        '<div class="faq-item' + (i === 0 ? ' open' : '') + '">' +
          '<button class="faq-question"><span>' + item.question + '</span><span class="plus">+</span></button>' +
          '<div class="faq-answer"><p>' + item.answer + '</p></div>' +
        '</div>'
      );
    }).join('');
  });

  container.addEventListener('click', function (e) {
    var q = e.target.closest('.faq-question');
    if (!q) return;
    q.closest('.faq-item').classList.toggle('open');
  });
}

/**
 * Fetches content/about.json and fills in the bio paragraphs and
 * values list on the About page.
 * @param {string} bioContainerId
 * @param {string} valuesContainerId
 */
function loadAbout(bioContainerId, valuesContainerId) {
  fetchJSON('content/about.json').then(function (data) {
    if (!data) return;

    var bioEl = document.getElementById(bioContainerId);
    if (bioEl && data.bio_paragraphs) {
      bioEl.innerHTML = data.bio_paragraphs.map(function (p) {
        return '<p>' + p + '</p>';
      }).join('');
    }

    var valuesEl = document.getElementById(valuesContainerId);
    if (valuesEl && data.values) {
      valuesEl.innerHTML = data.values.map(function (v) {
        return '<li>' + v + '</li>';
      }).join('');
    }
  });
}

function loadHome(){fetchJSON('content/home.json').then(function(data){if(!data)return;var map={'hero-eyebrow':data.hero_eyebrow,'hero-lede':data.hero_lede,'about-eyebrow':data.about_eyebrow,'about-heading':data.about_heading,'about-p1':data.about_paragraph1,'about-p2':data.about_paragraph2};Object.keys(map).forEach(function(id){var el=document.getElementById(id);if(el&&map[id])el.textContent=map[id];});var headlineEl=document.getElementById('hero-headline');if(headlineEl&&(data.hero_headline_line1||data.hero_headline_line2)){headlineEl.innerHTML=(data.hero_headline_line1||'')+'<br>'+(data.hero_headline_line2||'');}});}
