/**
 * hub-auth.js — Galeria Hub SSO Gate
 * Modo 1: sem auth próprio — verifica token via API do hub e redireciona se ausente/inválido.
 * Referência: gal-sso skill · Stack estático (HTML/CSS/JS puro, sem framework).
 */
(function () {
  'use strict';

  var HUB_URL     = 'https://galeria-os.web.app';
  var TOKEN_KEY   = 'galeria_hub_token';
  var TIMEOUT_MS  = 6000; // 6 s — prazo para o hub responder

  /* ── helpers de storage ─────────────────────────────────── */
  function getStored()   { try { return localStorage.getItem(TOKEN_KEY); }  catch (e) { return null; } }
  function storeToken(t) { try { localStorage.setItem(TOKEN_KEY, t); }       catch (e) {} }
  function clearToken()  { try { localStorage.removeItem(TOKEN_KEY); }       catch (e) {} }

  /* ── redirect para o hub ────────────────────────────────── */
  function redirectToHub() {
    window.location.href = HUB_URL + '?redirect=' + encodeURIComponent(window.location.href);
  }

  /* ── verificação do token via API do hub ────────────────── */
  function verifyToken(token) {
    return new Promise(function (resolve) {
      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var tid = setTimeout(function () {
        if (controller) controller.abort();
        resolve(null); // timeout → trata como falha de rede
      }, TIMEOUT_MS);

      var opts = {
        method : 'POST',
        headers: { Authorization: 'Bearer ' + token },
      };
      if (controller) opts.signal = controller.signal;

      fetch(HUB_URL + '/api/verify-token', opts)
        .then(function (res) {
          clearTimeout(tid);
          if (!res.ok) { resolve(null); return; }
          return res.json();
        })
        .then(function (d) {
          if (!d) return;
          resolve({
            userId   : d.userId,
            email    : d.email,
            projectId: d.projectId,
            type     : d.type || 'internal',
          });
        })
        .catch(function () {
          clearTimeout(tid);
          resolve(null); // erro de rede
        });
    });
  }

  /* ── overlay de carregamento (tema Bauhaus dark) ─────────── */
  function createOverlay() {
    var el = document.createElement('div');
    el.id = 'gal-auth-overlay';
    el.setAttribute('style', [
      'position:fixed',
      'inset:0',
      'background:#0F1419',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'z-index:99999',
      'transition:opacity .25s ease',
    ].join(';'));
    el.innerHTML =
      '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="20" cy="20" r="15" stroke="#C9A961" stroke-width="1.5" ' +
                'stroke-dasharray="70 24" stroke-linecap="round">' +
          '<animateTransform attributeName="transform" type="rotate" ' +
                             'from="0 20 20" to="360 20 20" dur="1s" repeatCount="indefinite"/>' +
        '</circle>' +
      '</svg>';
    return el;
  }

  function removeOverlay(el) {
    el.style.opacity = '0';
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 280);
  }

  /* ── gate principal ─────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    // Esconde o conteúdo enquanto verifica
    document.body.style.visibility = 'hidden';
    var overlay = createOverlay();
    document.body.appendChild(overlay);

    var params   = new URLSearchParams(window.location.search);
    var urlToken = params.get('token');
    var stored   = getStored();
    var token    = urlToken || stored;

    // Sem token algum → vai para o hub
    if (!token) {
      redirectToHub();
      return;
    }

    verifyToken(token).then(function (session) {
      if (!session) {
        if (urlToken) {
          // Token na URL inválido → limpa e redireciona
          clearToken();
          redirectToHub();
          return;
        }
        if (!stored) {
          // Sem token armazenado → redireciona
          redirectToHub();
          return;
        }
        // Token armazenado + falha de rede → fail open (não bloqueia uma reunião)
        console.warn('[galeria-sso] Hub inacessível — sessão em cache mantida.');
      } else {
        // Token válido
        if (urlToken) {
          storeToken(urlToken);
          params.delete('token');
          var qs = params.toString();
          window.history.replaceState(
            {},
            '',
            window.location.pathname + (qs ? '?' + qs : '') + window.location.hash
          );
        }
        window.__hubSession = session;
      }

      // Exibe o conteúdo
      document.body.style.visibility = '';
      removeOverlay(overlay);
    });
  });
})();
