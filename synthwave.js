// SYNTHWAVE GALAKSİ — tema açma/kapama (MEKA, 16 Eki 2026)
// <head> içinde, synthwave.css'ten sonra yükle:  <script src="synthwave.js"></script>
// Sayfada id="temaBtn" (ya da class="sw-tema-btn") olan düğme ☀️/🌌 olur ve temayı değiştirir.
// Seçim tarayıcıda "tema" anahtarıyla hatırlanır. Varsayılanı değiştirmek için: <html data-sw-varsayilan="acik">
(function () {
  const h = document.documentElement;
  const vars = h.dataset.swVarsayilan || "synth";
  try { h.dataset.tema = localStorage.getItem("tema") || vars; } catch (e) { h.dataset.tema = vars; }

  function ciz(b) {
    const s = h.dataset.tema === "synth";
    b.textContent = s ? "☀️" : "🌌";
    b.title = s ? "Açık temaya geç" : "Synthwave temasına geç";
  }
  window.swTema = function (yeni) {                     // başka koddan: swTema("acik") / swTema("synth") / swTema()
    h.dataset.tema = yeni || (h.dataset.tema === "synth" ? "acik" : "synth");
    try { localStorage.setItem("tema", h.dataset.tema); } catch (e) {}
    document.querySelectorAll("#temaBtn,.sw-tema-btn").forEach(ciz);
  };
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("#temaBtn,.sw-tema-btn").forEach(function (b) {
      b.addEventListener("click", function () { window.swTema(); });
      ciz(b);
    });
  });
})();
