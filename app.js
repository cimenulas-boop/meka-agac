(function () {
  var D = window.MEKA_DATA;
  var APP = document.getElementById('app');
  if (!D) { APP.innerHTML = '<div class="card">data.js yüklenemedi.</div>'; return; }
  document.getElementById('brandDate').textContent = D.derleme_tarihi;

  var BANT_SYM = { one_cikan: '★', ikincil: '○', izle: '▽', elendi: '▽' };
  var BANT_AD = { one_cikan: 'öne çıkan', ikincil: 'ikincil', izle: 'izle', elendi: 'elendi' };
  var BUTCE_AD = { 1: '100 bin $ altı', 2: '100 bin ile 1 M$', 3: '1 ile 10 M$', 4: '10 M$ üstü' };
  var YAT_AD = { sirket: 'şirket', kisisel: 'kişisel', ikisi: 'ikisi de olur' };
  var YOL_AD = { kur: 'kuralım', ortak: 'ortak olalım', ikisi: 'ikisi de olur' };
  var ROL_AD = { ortak_adayi: 'Ortak adayı', musteri: 'Müşteri', rakip: 'Rakip', tedarikci: 'Tedarikçi', kurum: 'Kurum', yatirimci: 'Yatırımcı', emsal: 'Emsal' };
  var ROL_SIRA = ['ortak_adayi', 'musteri', 'rakip', 'tedarikci', 'kurum', 'yatirimci', 'emsal'];
  var P = D.puan || { kriterler: [], profiller: [], esikler: { yildiz: 65, orta: 45 }, yontem: [] };
  var KR = P.kriterler;

  // ---------------- depolama: bu cihazdaki işaretler, notlar; ekibin durum.json'u ----------------
  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (x) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (x) {} }
  var yerel = lsGet('meka_durum', {});
  var uzak = {};
  var PROFIL = lsGet('meka_profil', 'dengeli');
  var sel = lsGet('meka_sel', { yatirim: 'hepsi', butce: 'hepsi', yol: 'hepsi' });
  function saveYerel() { lsSet('meka_durum', yerel); }
  function yer(id) { if (!yerel[id]) yerel[id] = {}; return yerel[id]; }
  var SKALER = ['durum', 'ilerleme', 'gorevler', 'not', 'saha_puan', 'saha_not', 'saha_tarih'];
  function bos(v) { return v === undefined || v === null || v === ''; }
  function dur(id) {
    var u = uzak[id] || {}, y = yerel[id] || {}, o = {};
    SKALER.forEach(function (k) { o[k] = bos(y[k]) ? u[k] : y[k]; });
    o.notlar = [];
    (u.notlar || []).forEach(function (n) { o.notlar.push({ t: n.t, m: n.m, kaynak: 'ekip' }); });
    (y.notlar || []).forEach(function (n, i) { o.notlar.push({ t: n.t, m: n.m, kaynak: 'yerel', i: i }); });
    o.notlar.sort(function (a, b) { return a.t < b.t ? 1 : -1; });
    return o;
  }
  function birlesik() {
    var out = {}, ids = {};
    Object.keys(uzak).forEach(function (k) { ids[k] = 1; });
    Object.keys(yerel).forEach(function (k) { ids[k] = 1; });
    Object.keys(ids).forEach(function (id) {
      var d = dur(id), o = {};
      SKALER.forEach(function (k) { if (!bos(d[k])) o[k] = d[k]; });
      o.notlar = d.notlar.map(function (n) { return { t: n.t, m: n.m }; });
      out[id] = o;
    });
    return out;
  }
  function notSay(id) { return dur(id).notlar.length; }

  // ---------------- kapılar ----------------
  function saveSel() { lsSet('meka_sel', sel); }
  function uyum(t) {
    var k = t.kapilar || {}; var r = { yatirim: true, butce: true, yol: true };
    if (sel.yatirim !== 'hepsi') r.yatirim = (k.yatirim === sel.yatirim || k.yatirim === 'ikisi');
    if (sel.butce !== 'hepsi') r.butce = ((k.butce || 1) <= Number(sel.butce));
    if (sel.yol !== 'hepsi') r.yol = (k.yol === sel.yol || k.yol === 'ikisi');
    r.ok = r.yatirim && r.butce && r.yol; return r;
  }
  function secimMetni() {
    var p = [];
    p.push(sel.yatirim === 'hepsi' ? 'yatırım: karar yok' : 'yatırım: ' + (sel.yatirim === 'sirket' ? 'şirket' : 'kişisel'));
    p.push(sel.butce === 'hepsi' ? 'bütçe: karar yok' : 'bütçe: ' + BUTCE_AD[sel.butce]);
    p.push(sel.yol === 'hepsi' ? 'yol: karar yok' : 'yol: ' + (sel.yol === 'kur' ? 'kuralım' : 'ortak olalım'));
    return p.join(' · ');
  }

  // ---------------- yardımcılar ----------------
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function linkify(s) {
    return e(s).replace(/(https?:\/\/[^\s<)]+)/g, function (u) { return '<a href="' + u + '" target="_blank" rel="noopener">' + (u.length > 48 ? u.slice(0, 46) + '…' : u) + '</a>'; });
  }
  function fmt1(x) { return (Math.round(x * 10) / 10).toString().replace('.', ','); }
  function topic(id) { return D.konular[id]; }
  function region(id) { return D.bolgeler[id]; }
  function tumYapraklar() { return Object.keys(D.konular).map(topic).filter(Boolean); }
  function regionTopics(rid) { var r = region(rid); var ids = (r && r.konu_ids) || []; return ids.map(topic).filter(Boolean); }
  function tsFmt(iso) { try { return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (x) { return iso; } }
  function daysBetween(a, b) { return Math.round((new Date(b) - new Date(a)) / 86400000); }

  // ---------------- genel puan ----------------
  function profil() {
    var ps = P.profiller || [];
    for (var i = 0; i < ps.length; i++) if (ps[i].id === PROFIL) return ps[i];
    return ps[0] || { id: 'dengeli', ad: 'Dengeli', agirliklar: {} };
  }
  // Yönetim kararı 1 puan formülünü değiştirir: kişisel yatırımda MEKA uyumu ölçütü kapanır, ağırlığı diğerlerine dağılır
  function agirlik(kid) { if (kid === 'M' && sel.yatirim === 'kisisel') return 0; return Number(profil().agirliklar[kid] || 0); }
  function secimEtkisi() {
    var all = tumYapraklar(); var soluk = all.filter(function (t) { return !uyum(t).ok; }).length;
    var p = [];
    if (sel.yatirim === 'kisisel') p.push('Kişisel yatırım: MEKA\'nın kendi üretmesi ya da kurması gereken yapraklar soluk; MEKA uyumu ölçütü puana katılmıyor. Kalanlar hisse, ortaklık, ruhsat ya da varlık alımıyla girilebilen işler.');
    if (sel.yatirim === 'sirket') p.push('Şirket üzerinden: yalnız kişiye açık yapraklar soluk; MEKA uyumu ölçütü puanda.');
    if (sel.butce !== 'hepsi') p.push('Bütçe: giriş bileti ' + BUTCE_AD[sel.butce] + ' dilimini aşan yapraklar soluk.');
    if (sel.yol === 'kur') p.push('Kuralım: yalnız ortaklıkla girilebilen yapraklar soluk.');
    if (sel.yol === 'ortak') p.push('Ortak olalım: yalnız kendi kurmayı gerektiren yapraklar soluk.');
    if (!p.length) return '<p class="tiny">Henüz karar seçilmedi; bütün yapraklar sayılıyor ve profil ağırlıkları olduğu gibi.</p>';
    return '<p class="muted" style="border-left:3px solid var(--acc);padding-left:10px"><b>Seçimin etkisi:</b> ' + p.join(' ') + ' Şu an ' + soluk + ' yaprak soluk, ' + (all.length - soluk) + ' yaprak sayılıyor.</p>';
  }
  function altPuan(t) { return t.puan || null; }
  function genelTemel(t) {
    var a = altPuan(t); if (!a || t.sepet) return null;
    var tot = 0, sw = 0;
    KR.forEach(function (k) { var s = a[k.id]; if (s == null) return; var w = agirlik(k.id); tot += w * (s - 1) / 4; sw += w; });
    return sw ? 100 * tot / sw : null;
  }
  function genelPuan(t) {
    var b = genelTemel(t); if (b == null) return null;
    var sp = Number(dur(t.id).saha_puan || 0);
    if (sp >= 1 && sp <= 5) b += (sp - 3) * 5;
    return Math.max(0, Math.min(100, b));
  }
  function aktif(t) { return uyum(t).ok && dur(t.id).durum !== 'vazgeçildi'; }
  function bantOf(t) {
    var d = dur(t.id);
    if (d.durum === 'vazgeçildi') return 'elendi';
    if (t.bant === 'elendi' && bos(d.saha_puan)) return 'elendi';
    var s = genelPuan(t);
    if (s == null) return 'izle';
    return s >= P.esikler.yildiz ? 'one_cikan' : (s >= P.esikler.orta ? 'ikincil' : 'izle');
  }
  function sirala(list) {
    return list.slice().sort(function (a, b) {
      var ua = aktif(a) ? 0 : 1, ub = aktif(b) ? 0 : 1; if (ua !== ub) return ua - ub;
      var ga = genelPuan(a), gb = genelPuan(b); ga = ga == null ? -1 : ga; gb = gb == null ? -1 : gb;
      if (ga !== gb) return gb - ga;
      return (b.kanit || 0) - (a.kanit || 0);
    });
  }
  function rankMap() {
    var all = tumYapraklar().filter(function (t) { return genelPuan(t) != null; }).sort(function (a, b) { return genelPuan(b) - genelPuan(a); });
    var m = {}; all.forEach(function (t, i) { m[t.id] = i + 1; }); return m;
  }
  function dugumPuani(list) {
    var xs = list.filter(aktif).map(genelPuan).filter(function (x) { return x != null; }).sort(function (a, b) { return b - a; });
    if (!xs.length) return null;
    var top = xs.slice(0, 3);
    return top.reduce(function (a, b) { return a + b; }, 0) / top.length;
  }
  function dalYapraklari(br) { return br.kollar.reduce(function (a, k) { return a.concat(k.konular.map(topic).filter(Boolean)); }, []); }
  function kolYapraklari(k) { return k.konular.map(topic).filter(Boolean); }
  function dugumRozet(list) {
    var p = dugumPuani(list);
    if (p == null) return list.length ? '<span class="pill warn">seçime uyan yok</span>' : '<span class="scr sm">–</span>';
    return puanRozet(p, true);
  }
  function puanRozet(g, kucuk) {
    if (g == null) return '<span class="scr">–</span>';
    var c = g >= P.esikler.yildiz ? 'hi' : (g >= P.esikler.orta ? 'mid' : 'lo');
    return '<span class="scr ' + c + (kucuk ? ' sm' : '') + '">' + Math.round(g) + '</span>';
  }
  function gucluZayif(t) {
    var a = altPuan(t); if (!a) return '';
    var items = KR.map(function (k) { return { k: k, s: a[k.id] }; }).filter(function (x) { return x.s != null && agirlik(x.k.id) > 0; });
    var up = items.slice().sort(function (p, q) { return q.s - p.s; }).filter(function (x) { return x.s >= 4; }).slice(0, 2).map(function (x) { return x.k.poz; });
    var dn = items.slice().sort(function (p, q) { return p.s - q.s; }).filter(function (x) { return x.s <= 2; }).slice(0, 2).map(function (x) { return x.k.neg; });
    return (up.length ? '+ ' + up.join(', ') : '') + (up.length && dn.length ? ' · ' : '') + (dn.length ? '− ' + dn.join(', ') : '');
  }

  // ---------------- küçük bileşenler ----------------
  function leafHtml(t) {
    var b = bantOf(t), g = genelPuan(t), n = notSay(t.id);
    return '<a class="leaf' + (aktif(t) ? '' : ' off') + '" href="#/konu/' + t.id + '"><span class="sym ' + b + '">' + BANT_SYM[b] + '</span><span class="t">' + e(t.kisa || t.baslik) + (n ? ' <span class="tiny">· ' + n + ' not</span>' : '') + '</span>' + puanRozet(g, true) + '</a>';
  }
  var DOC_ICON = '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/></svg>';
  function butonlarHtml(t) {
    var bs = t.butonlar || [];
    if (!bs.length) return '';
    var ETIKET = { tam: 'Tam çalışmayı aç', ana: 'Ana raporda ilgili bölüm', kaynak: 'Kaynak belgeyi aç' };
    var html = '<div class="fullrow">' + bs.map(function (b, i) {
      var f = D.dosyalar[b.dosya]; if (!f) return '';
      var href = 'pdf/' + f.pdf + (b.sayfa && b.sayfa > 1 ? '#page=' + b.sayfa : '');
      var l2 = (f.kisa || f.ad) + ' · ' + (f.sayfa_sayisi ? f.sayfa_sayisi + ' sayfa' : 'PDF') + (b.sayfa && b.sayfa > 1 ? ' · s. ' + b.sayfa : '');
      return '<a class="fullbtn' + (i ? ' alt' : '') + '" href="' + e(href) + '" target="_blank" rel="noopener">' + DOC_ICON + '<span class="fb"><span class="l1">' + (f.btn || ETIKET[b.rol]) + '</span><span class="l2">' + e(l2) + '</span></span></a>';
    }).join('') + '</div>';
    if (bs[0].rol === 'kaynak') html += '<p class="tiny" style="margin-top:6px">Bu yaprak için ayrı bir tam çalışma yok; özet bu kaynak belgelere dayanıyor.</p>';
    return html;
  }
  function ilerleme(id) {
    var d = dur(id); var g = d.gorevler || []; var bitti = g.filter(function (x) { return x.bitti; }).length;
    var yuzde = d.ilerleme != null && d.ilerleme !== '' ? Number(d.ilerleme) : (g.length ? Math.round(100 * bitti / g.length) : 0);
    return { yuzde: yuzde, toplam: g.length, bitti: bitti, durum: d.durum || 'başlanmadı', gorevler: g, not: d.not || '', saha_puan: d.saha_puan || '', saha_not: d.saha_not || '', saha_tarih: d.saha_tarih || '' };
  }

  // ---------------- kapı ve profil paneli ----------------
  function gatesHtml() {
    function seg(name, opts, cur, attr) {
      return '<div class="seg">' + opts.map(function (o) { return '<button type="button" data-' + attr + '="' + name + '" data-val="' + o[0] + '" class="' + (String(cur) === String(o[0]) ? 'on' : '') + '">' + e(o[1]) + '</button>'; }).join('') + '</div>';
    }
    var prof = (P.profiller || []).map(function (p) { return [p.id, p.ad]; });
    return '<div class="card"><div class="eyebrow">Yönetimin üç kararı</div><p class="muted">Seçim yapınca uymayan yapraklar soluklaşır; sıralama, yol önerisi ve yapılacaklar değişir. Seçim bu cihazda kalır.</p><div id="gates">' +
      '<div class="gate"><div class="q">1. Yatırım kimin üzerinden?</div>' + seg('yatirim', [['sirket', 'Şirket (MEKA)'], ['kisisel', 'Kişisel'], ['hepsi', 'Karar yok']], sel.yatirim, 'gate') + '</div>' +
      '<div class="gate"><div class="q">2. İlk bütçe dilimi?</div>' + seg('butce', [['1', '< 100 bin $'], ['2', '100 bin ile 1 M$'], ['3', '1 ile 10 M$'], ['4', '> 10 M$'], ['hepsi', 'Karar yok']], sel.butce, 'gate') + '</div>' +
      '<div class="gate"><div class="q">3. Kuralım mı, ortak mı olalım?</div>' + seg('yol', [['kur', 'Kuralım'], ['ortak', 'Ortak olalım'], ['hepsi', 'Karar yok']], sel.yol, 'gate') + '</div>' +
      '</div>' + (prof.length ? '<div class="gate" style="margin-top:10px"><div class="q">Puan profili: ölçüt ağırlıkları</div>' + seg('profil', prof, PROFIL, 'gate') + '</div>' : '') +
      secimEtkisi() + '<details><summary class="tiny">Dilim, kapı ve profil kuralı</summary><p class="tiny" style="margin-top:4px">' + e(D.dilim_kurali || '') + '</p></details></div>';
  }

  // ---------------- önerilen yol ----------------
  function yolHtml() {
    var dals = D.agac.map(function (br) { return { br: br, p: dugumPuani(dalYapraklari(br)) }; }).filter(function (x) { return x.p != null; });
    if (!dals.length) return '<div class="card"><div class="eyebrow">Önerilen yol</div><p class="muted">Seçime uyan yaprak kalmadı. Kararlardan birini gevşet.</p></div>';
    dals.sort(function (a, b) { return b.p - a.p; });
    var bd = dals[0];
    var kols = bd.br.kollar.map(function (k) { return { k: k, p: dugumPuani(kolYapraklari(k)) }; }).filter(function (x) { return x.p != null; }).sort(function (a, b) { return b.p - a.p; });
    var bk = kols[0];
    var leaf = sirala(kolYapraklari(bk.k)).filter(aktif)[0];
    var tum = sirala(tumYapraklar()).filter(aktif).slice(0, 5);
    var h = '<div class="card"><div class="eyebrow">Önerilen yol (seçimine göre)</div><div class="pathrow">' +
      '<a class="pnode" href="#/bolge/' + bd.br.id + '"><small>Dal</small><b>' + e(bd.br.ad) + '</b>' + puanRozet(bd.p, true) + '</a><span class="parrow">›</span>' +
      '<a class="pnode" href="#/bolge/' + bk.k.id + '"><small>Kol</small><b>' + e(bk.k.ad) + '</b>' + puanRozet(bk.p, true) + '</a><span class="parrow">›</span>' +
      '<a class="pnode" href="#/konu/' + leaf.id + '"><small>Yaprak</small><b>' + e(leaf.kisa || leaf.baslik) + '</b>' + puanRozet(genelPuan(leaf), true) + '</a></div>' +
      '<p class="tiny">Dal ve kol puanı, içindeki en iyi üç yaprağın ortalamasıdır. Diğer dal: ' + (dals[1] ? e(dals[1].br.ad) + ' (' + Math.round(dals[1].p) + ')' : 'seçime uyan yaprak yok') + '.</p>' +
      '<div class="eyebrow" style="margin-top:6px">Genel sıralamada ilk beş</div><div>' + tum.map(function (t, i) {
        return '<a class="leaf" href="#/konu/' + t.id + '"><span class="n">' + (i + 1) + '</span><span class="t">' + e(t.kisa || t.baslik) + ' <span class="tiny">· ' + e(t.dal_ad) + '</span></span>' + puanRozet(genelPuan(t), true) + '</a>';
      }).join('') + '</div><a href="#/siralama" class="tiny">Sıralamanın tamamı ve puanlama yöntemi ›</a></div>';
    return h;
  }

  // ---------------- sayfalar ----------------
  function homeHtml() {
    var h = '';
    h += '<div><div class="eyebrow">MEKA Global · yeni iş alanı araştırmaları</div><h1>' + e(D.baslik) + '</h1><p class="muted">' + e(D.alt_baslik) + '</p></div>';
    h += gatesHtml();
    h += yolHtml();
    h += '<div class="card soft edit"><div class="eyebrow">Düzenleme modu nasıl işler</div><ul class="plain"><li>Bir yaprağı aç, en alttaki Durum kartında ilerleme, görevler ve saha puanını gir, Kaydet.</li><li>Saha puanı 1 ile 5: 3 nötr, 5 genel puana 10 puan ekler, 1 on puan düşürür. Görüşme notunu da yaz.</li><li>Notlar her yaprakta ayrı kartta; düzenleme moduna gerek yok.</li><li>Herkes görsün istersen sayfanın altından durumu dışa aktar, durum.json dosyasını GitHub deposunun köküne yükle.</li></ul></div>';
    h += '<div class="tree">';
    h += '<div class="root"><div class="eyebrow" style="color:#F2B28B">Kök</div><h2>MEKA</h2><p class="muted" style="color:#ddd">' + e(D.kok_notu) + '</p></div>';
    D.agac.forEach(function (br) {
      var dp = dugumPuani(dalYapraklari(br));
      h += '<div class="branch ' + br.id + '"><a class="head" href="#/bolge/' + br.id + '"><h2>' + e(br.ad) + '</h2><span class="tiny">dal puanı ' + dugumRozet(dalYapraklari(br)) + ' · ' + e(br.id === 'meka' && sel.yatirim === 'kisisel' ? 'kişisel yatırımda yalnız hisse, ortaklık ya da ruhsatla girilebilen yapraklar sayılıyor' : br.aciklama) + ' ›</span></a><div class="kols">';
      br.kollar.forEach(function (k) {
        var ts = sirala(kolYapraklari(k));
        var kp = dugumPuani(ts);
        h += '<div class="kol"><a class="head" href="#/bolge/' + k.id + '"><h3>' + e(k.ad) + '</h3><span class="tiny">' + dugumRozet(ts) + ' · ' + ts.length + ' yaprak ›</span></a><div>' + ts.map(leafHtml).join('') + '</div></div>';
      });
      h += '</div></div>';
    });
    h += '</div>';
    h += '<div class="card"><div class="eyebrow">İşaretler ve puan</div><p class="muted">Her yaprak aynı sekiz ölçütle 0 ile 100 arasında puanlandı; bir çalışmanın 7 puanı başka çalışmanın 6 puanıyla artık aynı ölçekte kıyaslanır. <b class="sym one_cikan">★</b> ' + P.esikler.yildiz + ' ve üzeri · <b class="sym ikincil">○</b> ' + P.esikler.orta + ' ile ' + (P.esikler.yildiz - 1) + ' · <b class="sym izle">▽</b> ' + P.esikler.orta + ' altı ya da çalışma elemiş. <a href="#/siralama">Yöntem ve sıralama ›</a></p></div>';
    h += '<div class="card"><div class="eyebrow">Görüş</div>' + D.gorus.map(function (g) { return '<p style="padding-left:10px;border-left:3px solid var(--acc)">' + e(g) + '</p>'; }).join('') + '</div>';
    h += '<div class="foot">' + e(D.dipnot) + '</div>';
    return h;
  }

  function dugumlerHtml() {
    var h = '<div class="grid2">';
    D.agac.forEach(function (br) {
      h += '<div class="card"><a class="head" href="#/bolge/' + br.id + '" style="text-decoration:none;color:inherit"><div class="eyebrow">Dal</div><h3>' + e(br.ad) + ' ' + dugumRozet(dalYapraklari(br)) + '</h3></a>';
      br.kollar.forEach(function (k) {
        var ts = kolYapraklari(k); var best = sirala(ts).filter(aktif)[0];
        h += '<a class="leaf" href="#/bolge/' + k.id + '"><span class="sym">›</span><span class="t">' + e(k.ad) + ' <span class="tiny">· ' + ts.length + ' yaprak' + (best ? ' · en iyi: ' + e(best.kisa || best.baslik) : '') + '</span></span>' + dugumRozet(ts) + '</a>';
      });
      h += '</div>';
    });
    return h + '</div>';
  }

  function siralamaHtml() {
    var rm = rankMap(); var all = sirala(tumYapraklar());
    var h = '<a class="back" href="#/">‹ Ağaca dön</a><div><div class="eyebrow">Genel sıralama</div><h1>' + Object.keys(rm).length + ' yaprak, tek ölçek</h1><p class="muted">Her yaprak aynı sekiz ölçütle ve aynı ağırlıklarla puanlandı. Çalışmaların kendi puanları (5 üzerinden, 10 üzerinden, sıra numarası) karşılaştırmada kullanılmadı. ' + e(secimMetni()) + ' · profil: ' + e(profil().ad) + '</p></div>';
    h += gatesHtml();
    h += '<div class="eyebrow">Dallar ve kollar</div>' + dugumlerHtml();
    h += '<div class="card"><div class="eyebrow">Tüm yapraklar</div><div class="rank">' + all.map(function (t, i) {
      var b = bantOf(t);
      return '<a href="#/konu/' + t.id + '" class="' + (aktif(t) ? '' : 'off') + '"><span class="n">' + (i + 1) + '</span><span class="sym ' + b + '">' + BANT_SYM[b] + '</span><span><b>' + e(t.kisa || t.baslik) + '</b> <span class="tiny">' + e(t.dal_ad) + ' › ' + e(t.kol_ad) + ' · kanıt ' + e(t.kanit) + '/5' + (t.sepet ? ' · sepet: puanlanmadı' : '') + (aktif(t) ? '' : ' · seçime uymaz') + '</span><div class="why">' + e(gucluZayif(t)) + '</div></span>' + puanRozet(genelPuan(t)) + '</a>';
    }).join('') + '</div></div>';
    h += '<div class="card"><div class="eyebrow">Puan nasıl hesaplanıyor</div><ul class="plain">' + (P.yontem || []).map(function (s) { return '<li>' + e(s) + '</li>'; }).join('') + '<li>Yönetim kararı 1 formülü değiştirir: kişisel yatırım seçilince MEKA uyumu ölçütü kapanır ve ağırlığı kalan ölçütlere dağılır. Böylece bağımsız dal MEKA tesisine uymadığı için puan kaybetmez.</li></ul>' +
      '<div class="kv" style="margin-top:8px">' + KR.map(function (k) {
        return '<div class="r"><div class="k">' + e(k.id) + ' · %' + agirlik(k.id) + '</div><div><b>' + e(k.ad) + '</b> <span class="tiny">' + (k.kaynak === 'sistem' ? 'sistemden: ' : 'puanlayıcılar: ') + '</span>' + e(k.aciklama) + '<div class="src">' + e(k.capa || '') + '</div></div></div>';
      }).join('') + '</div></div>';
    return h;
  }

  function regionHtml(rid) {
    var r = region(rid); if (!r) return '<div class="card">Bölge bulunamadı.</div>';
    var isDal = rid === 'meka' || rid === 'bagimsiz';
    var ts = sirala(regionTopics(rid));
    var np = dugumPuani(ts);
    var h = '<a class="back" href="#/">‹ Ağaca dön</a>';
    h += '<div><div class="eyebrow">' + (isDal ? 'Dal' : 'Kol') + '</div><h1>' + e(r.baslik) + '</h1><p class="muted">' + ts.length + ' yaprak · ' + e(secimMetni()) + '</p></div>';
    h += '<div class="card"><div class="eyebrow">' + (isDal ? 'Dal' : 'Kol') + ' puanı</div><div class="row"><span class="bigscore">' + (np == null ? '–' : Math.round(np)) + '</span><span class="muted">' + (np == null && ts.length ? 'Bu bölgede seçime uyan yaprak yok; kararlardan birini gevşet. ' : 'en iyi üç yaprağın ortalaması, seçime uyanlar arasında. ') + (ts.filter(aktif)[0] ? 'En iyi yaprak: <a href="#/konu/' + ts.filter(aktif)[0].id + '">' + e(ts.filter(aktif)[0].kisa || ts.filter(aktif)[0].baslik) + '</a>.' : '') + '</span></div>';
    if (isDal) {
      var br = D.agac.filter(function (b) { return b.id === rid; })[0];
      if (br) h += '<div style="margin-top:6px">' + br.kollar.map(function (k) { return '<a class="leaf" href="#/bolge/' + k.id + '"><span class="sym">›</span><span class="t">' + e(k.ad) + '</span>' + dugumRozet(kolYapraklari(k)) + '</a>'; }).join('') + '</div>';
    }
    h += '</div>';
    h += '<div class="card"><div class="eyebrow">Özet</div><p>' + e(r.ozet) + '</p></div>';
    h += '<div class="card"><div class="eyebrow">Sıralama (genel puana göre)</div><div class="rank">' + ts.map(function (t, i) {
      var b = bantOf(t);
      return '<a href="#/konu/' + t.id + '" class="' + (aktif(t) ? '' : 'off') + '"><span class="n">' + (i + 1) + '</span><span class="sym ' + b + '">' + BANT_SYM[b] + '</span><span><b>' + e(t.kisa || t.baslik) + '</b> <span class="tiny">kanıt ' + e(t.kanit) + '/5' + (aktif(t) ? '' : ' · seçime uymaz') + '</span><div class="why">' + e(gucluZayif(t)) + '</div></span>' + puanRozet(genelPuan(t)) + '</a>';
    }).join('') + '</div></div>';
    var ke = r.kapi_etkisi || {};
    var etk = [];
    if (sel.yatirim === 'sirket') etk.push(ke.sirket); if (sel.yatirim === 'kisisel') etk.push(ke.kisisel);
    if (sel.butce === '1' || sel.butce === '2') etk.push(ke.dusuk_butce); if (sel.butce === '3' || sel.butce === '4') etk.push(ke.yuksek_butce);
    if (sel.yol === 'kur') etk.push(ke.kur); if (sel.yol === 'ortak') etk.push(ke.ortak);
    h += '<div class="card"><div class="eyebrow">Kararlar bu bölgeyi nasıl değiştirir</div>' + (etk.length ? etk.filter(Boolean).map(function (x) { return '<p>' + e(x) + '</p>'; }).join('') : '<p class="muted">Henüz karar seçilmedi. Seçince burada etkisi yazar.</p>') +
      '<details><summary>Altı durumun hepsi</summary><div class="kv" style="margin-top:8px">' + [['Şirket', ke.sirket], ['Kişisel', ke.kisisel], ['Düşük bütçe', ke.dusuk_butce], ['Yüksek bütçe', ke.yuksek_butce], ['Kuralım', ke.kur], ['Ortak', ke.ortak]].map(function (p) { return '<div class="r"><div class="k">' + e(p[0]) + '</div><div>' + e(p[1]) + '</div></div>'; }).join('') + '</div></details></div>';
    var steps = (r.ne_yapmali || []).filter(function (s) { var t = topic(s.konu_id); return !t || aktif(t); });
    h += '<div class="card"><div class="eyebrow">Ne yapmalıyız</div><div class="steps">' + steps.map(function (s, i) {
      var t = topic(s.konu_id);
      return '<div class="step"><div class="n">' + (i + 1) + '</div><div>' + e(s.adim) + '<div class="meta">' + e(s.kim) + ' · ' + e(s.ne_zaman) + (t ? ' · <a href="#/konu/' + t.id + '">' + e(t.kisa || t.baslik) + '</a>' : '') + '</div></div></div>';
    }).join('') + (steps.length ? '' : '<p class="muted">Seçime uyan adım kalmadı.</p>') + '</div></div>';
    if (r.uyarilar && r.uyarilar.length) h += '<div class="card soft"><div class="eyebrow">Uyarılar</div><ul class="plain">' + r.uyarilar.map(function (u) { return '<li>' + e(u) + '</li>'; }).join('') + '</ul></div>';
    return h;
  }

  function puanKartiHtml(t) {
    if (t.sepet) return '<div class="card soft"><div class="eyebrow">Genel puan</div><p>Bu yaprak birden çok küçük fikri bir arada tutan bir sepet. Tek bir puan verilmedi; genel sıralamaya ve dal puanına girmez. Bir fikri öne çıkarmak istersen onu ayrı yaprak olarak araştırmak gerekir.</p></div>';
    var a = altPuan(t); if (!a) return '';
    var g = genelPuan(t); var rm = rankMap(); var n = Object.keys(rm).length;
    var sp = Number(dur(t.id).saha_puan || 0);
    var h = '<div class="card"><div class="eyebrow">Genel puan</div><div class="row" style="align-items:flex-end"><span class="bigscore">' + (g == null ? '–' : Math.round(g)) + '</span><span class="muted">/ 100 · genel sıra ' + (rm[t.id] || '–') + ' / ' + n + ' · profil: ' + e(profil().ad) + (sp >= 1 && sp <= 5 ? ' · saha düzeltmesi ' + (sp - 3 >= 0 ? '+' : '') + ((sp - 3) * 5) : '') + '</span></div>';
    h += '<div class="crits">' + KR.map(function (k) {
      var s = a[k.id]; var pct = s == null ? 0 : Math.round((s - 1) / 4 * 100);
      var not = (t.puan_not && t.puan_not[k.id]) || (k.id === 'B' ? ((BUTCE_AD[(t.kapilar || {}).butce] || '') + ' dilimi. ' + ((t.kapilar || {}).butce_not || '')) : '') || (k.id === 'K' ? ('Kanıt ' + (t.kanit || '–') + '/5, ' + (t.kapsam === 'tam' ? 'tam çalışma var' : 'kısmen çalışıldı')) : '');
      return '<div class="crit"' + (agirlik(k.id) ? '' : ' style="opacity:0.45"') + '><div class="cl"><span class="cn">' + e(k.ad) + '</span><span class="cw">' + (agirlik(k.id) ? '%' + agirlik(k.id) : 'kişisel seçiminde kapalı') + '</span><b>' + (s == null ? '–' : fmt1(s)) + '/5</b></div><div class="cbar"><i style="width:' + pct + '%"></i></div>' + (not ? '<div class="cnote">' + e(not) + '</div>' : '') + '</div>';
    }).join('') + '</div>';
    if (t.puan_yayilim && t.puan_yayilim.length) h += '<p class="tiny">Puanlayıcılar şu ölçütlerde ayrıştı: ' + t.puan_yayilim.map(function (x) { return e(x); }).join(', ') + '. Bu ölçütlerdeki puan daha belirsiz.</p>';
    h += '<details><summary class="tiny">Çalışmanın kendi hükmü ve puanı (karşılaştırmada kullanılmaz)</summary><p class="tiny" style="margin-top:4px">Çalışmanın bandı: ' + e(BANT_AD[t.bant] || t.bant) + '. ' + e(t.puan_metni || '') + '</p></details></div>';
    return h;
  }

  function notlarHtml(t) {
    var d = dur(t.id);
    var h = '<div class="card"><div class="eyebrow">Notlar</div><div class="notebox"><textarea id="not-' + t.id + '" rows="2" placeholder="Not yaz: kiminle konuşuldu, ne öğrenildi, ne yapılacak"></textarea><button type="button" class="btn primary" data-act="nota-ekle" data-id="' + t.id + '">Notu ekle</button></div>';
    if (d.notlar.length) {
      h += '<div class="notes">' + d.notlar.map(function (n) {
        return '<div class="note"><div class="meta">' + e(tsFmt(n.t)) + ' · ' + (n.kaynak === 'ekip' ? 'ekip notu' : 'bu cihazda') + (n.kaynak === 'yerel' ? ' · <button type="button" class="lnk" data-act="nota-sil" data-id="' + t.id + '" data-i="' + n.i + '">sil</button>' : '') + '</div><div>' + e(n.m).replace(/\n/g, '<br>') + '</div></div>';
      }).join('') + '</div>';
    } else h += '<p class="tiny">Henüz not yok. Notlar bu cihazda saklanır. Herkes görsün istersen sayfanın altından durumu dışa aktar ve siteye yükle.</p>';
    return h + '</div>';
  }

  function firmalarHtml(t) {
    var f = t.firmalar || []; if (!f.length) return '';
    var by = {}; f.forEach(function (x) { var r = ROL_AD[x.rol] ? x.rol : 'emsal'; (by[r] = by[r] || []).push(x); });
    var h = '<div class="card"><div class="eyebrow">Şirketler ve kurumlar (' + f.length + ')</div>';
    var first = true;
    ROL_SIRA.forEach(function (r) {
      if (!by[r]) return;
      h += '<details' + (first || f.length <= 8 ? ' open' : '') + '><summary><b>' + ROL_AD[r] + '</b> (' + by[r].length + ')</summary><div class="firms">' + by[r].map(function (x) {
        return '<div class="firm"><b>' + e(x.ad) + '</b> <span>' + e(x.not) + '</span>' + (x.kaynak ? '<div class="src">' + linkify(x.kaynak) + '</div>' : '') + '</div>';
      }).join('') + '</div></details>';
      first = false;
    });
    return h + '</div>';
  }

  function ekonomiHtml(t) {
    var x = t.ekonomi; if (!x) return '';
    var rows = [['Giriş bileti', x.bilet], ['İlk gelire kadar', x.sure_ilk_gelir], ['Yıllık kâr potansiyeli', x.yillik_kar_potansiyeli], ['Varsayımlar', x.varsayimlar]].filter(function (r) { return r[1]; });
    if (!rows.length) return '';
    return '<div class="card"><div class="eyebrow">Ekonomi (kaba tahmin)</div><div class="kv">' + rows.map(function (r) { return '<div class="r"><div class="k" style="font-size:17px">' + e(r[0]) + '</div><div>' + e(r[1]) + '</div></div>'; }).join('') + '</div></div>';
  }

  function topicHtml(id) {
    var t = topic(id); if (!t) return '<div class="card">Yaprak bulunamadı.</div>';
    var u = uyum(t); var k = t.kapilar || {}; var il = ilerleme(id); var b = bantOf(t); var g = genelPuan(t);
    var h = '<a class="back" href="#/bolge/' + t.kol_id + '">‹ ' + e(t.kol_ad) + '</a>';
    h += '<div><div class="eyebrow">' + e(t.dal_ad) + ' · ' + e(t.kol_ad) + '</div><h1>' + e(t.baslik) + '</h1>' + butonlarHtml(t) +
      '<div class="row" style="margin-top:12px"><span class="pill ' + (b === 'one_cikan' ? 'acc' : '') + '"><span class="sym ' + b + '">' + BANT_SYM[b] + '</span>' + BANT_AD[b] + '</span><span class="pill steel">genel puan ' + (g == null ? '–' : Math.round(g)) + '</span><span class="pill">kaynak tarihi ' + e(t.tarih) + '</span><span class="pill">kanıt ' + e(t.kanit) + '/5</span>' +
      '<span class="pill ' + (t.kapsam === 'tam' ? 'ok' : 'warn') + '">kapsam: ' + e(t.kapsam === 'tam' ? 'tam çalışma var' : (t.kapsam === 'kismi' ? 'kısmen çalışıldı' : 'çalışılmadı')) + '</span>' + (u.ok ? '' : '<span class="pill warn">seçime uymaz</span>') + '</div></div>';
    h += puanKartiHtml(t);
    h += notlarHtml(t);
    if (t.kapsam !== 'tam' && t.kapsam_notu) h += '<div class="card soft"><p>' + e(t.kapsam_notu) + '</p></div>';
    h += '<div class="grid2">';
    h += '<div class="card"><div class="eyebrow">Ne</div><p>' + e(t.ne) + '</p></div>';
    h += '<div class="card"><div class="eyebrow">Neden MEKA için</div><p>' + e(t.neden) + '</p></div>';
    h += '</div>';
    h += ekonomiHtml(t);
    if (t.rakamlar && t.rakamlar.length) h += '<div class="card"><div class="eyebrow">Rakamlar</div><div class="kv">' + t.rakamlar.map(function (r) { var web = /\bweb\b|https?:/i.test(r.kaynak || ''); return '<div class="r"><div class="k">' + e(r.deger) + '</div><div>' + e(r.aciklama) + '<div class="src">' + linkify(r.kaynak || '') + (web ? ' <span class="pill warn" style="font-size:12px">web, çalışmalarda yok</span>' : '') + '</div></div></div>'; }).join('') + '</div></div>';
    h += '<div class="card"><div class="eyebrow">Durum</div><p>' + e(t.durum) + '</p>' +
      '<div class="row" style="margin-top:4px"><span class="pill">' + e(il.durum) + '</span><span class="pill">' + il.yuzde + '% ilerleme</span><span class="pill">' + il.bitti + '/' + il.toplam + ' görev</span></div><div class="prog"><i style="width:' + il.yuzde + '%"></i></div>' +
      (il.gorevler.length ? '<div class="steps">' + il.gorevler.map(function (g2) { return '<div class="task' + (g2.bitti ? ' done' : '') + '"><span>' + (g2.bitti ? '☑' : '☐') + '</span><span>' + e(g2.ad) + '</span></div>'; }).join('') + '</div>' : '') + (il.not ? '<p class="muted">' + e(il.not) + '</p>' : '') +
      '<div class="edit"><label>Durum<select data-ed="durum">' + ['başlanmadı', 'sürüyor', 'bekliyor', 'bitti', 'vazgeçildi'].map(function (o) { return '<option' + (il.durum === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></label>' +
      '<label>İlerleme yüzdesi<input type="number" min="0" max="100" data-ed="ilerleme" value="' + il.yuzde + '"></label>' +
      '<label>Görevler (her satır bir görev; başına x koyarsan bitti sayılır)<textarea data-ed="gorevler" rows="4">' + e(il.gorevler.map(function (g2) { return (g2.bitti ? 'x ' : '') + g2.ad; }).join('\n')) + '</textarea></label>' +
      '<label>Kısa not<input type="text" data-ed="not" value="' + e(il.not) + '"></label>' +
      '<div class="eyebrow" style="margin-top:6px">Saha kararı (bayi, müşteri, kurum görüşmesinden sonra)</div>' +
      '<label>Saha puanı, 1 ile 5 (3 nötr; 5 genel puana +10, 1 ise −10 ekler)<input type="number" min="1" max="5" data-ed="saha_puan" value="' + e(il.saha_puan) + '"></label>' +
      '<label>Saha notu: kimle konuşuldu, ne öğrenildi<textarea data-ed="saha_not" rows="3">' + e(il.saha_not) + '</textarea></label>' +
      '<label>Görüşme tarihi<input type="text" data-ed="saha_tarih" placeholder="örnek: 20 Ekim 2026" value="' + e(il.saha_tarih) + '"></label>' +
      '<div class="row"><button type="button" class="btn primary" data-act="kaydet" data-id="' + id + '">Kaydet</button><span class="tiny">Kaydet bu cihazda tutar. Herkes görsün istersen sayfanın altından durumu dışa aktar.</span></div></div></div>';
    if (il.saha_puan || il.saha_not) h += '<div class="card" style="border-left:4px solid var(--ok)"><div class="eyebrow">Saha bilgisi' + (il.saha_tarih ? ' · ' + e(il.saha_tarih) : '') + '</div><div class="row">' + (il.saha_puan ? '<span class="pill ok">saha puanı ' + e(il.saha_puan) + '/5</span>' : '') + '</div>' + (il.saha_not ? '<p>' + e(il.saha_not) + '</p>' : '') + '</div>';
    h += '<div class="grid2">';
    if (t.adimlar && t.adimlar.length) h += '<div class="card"><div class="eyebrow">İlk adımlar</div><div class="steps">' + t.adimlar.map(function (s, i) { return '<div class="step"><div class="n">' + (i + 1) + '</div><div>' + e(s.adim) + '<div class="meta">' + e(s.kim) + ' · ' + e(s.ne_zaman) + '</div></div></div>'; }).join('') + '</div></div>';
    h += '<div class="card"><div class="eyebrow">Kararlarla uyum</div><div class="match">' +
      '<div class="m"><span>Yatırım: <b>' + e(YAT_AD[k.yatirim] || '') + '</b></span><span class="pill ' + (u.yatirim ? 'ok' : 'warn') + '">' + (u.yatirim ? 'uyar' : 'uymaz') + '</span></div>' +
      '<div class="m"><span>Bütçe: <b>' + e(BUTCE_AD[k.butce] || '') + '</b></span><span class="pill ' + (u.butce ? 'ok' : 'warn') + '">' + (u.butce ? 'uyar' : 'uymaz') + '</span></div>' +
      '<div class="m"><span>Yol: <b>' + e(YOL_AD[k.yol] || '') + '</b></span><span class="pill ' + (u.yol ? 'ok' : 'warn') + '">' + (u.yol ? 'uyar' : 'uymaz') + '</span></div></div>' +
      '<p class="tiny">' + e(k.butce_not || '') + ' ' + e(k.yol_not || '') + '</p></div>';
    h += '</div>';
    h += firmalarHtml(t);
    if (t.cevaplar && t.cevaplar.length) {
      var CD = { cevaplandi: ['ok', 'cevaplandı'], kismen: ['warn', 'kısmen'], gorusme: ['steel', 'görüşme gerekir'], kapandi: ['', 'kapandı'] };
      h += '<div class="card"><div class="eyebrow">Açık soruların cevapları</div><div class="steps">' + t.cevaplar.map(function (c, i) {
        var cd = CD[c.durum] || ['', c.durum];
        return '<div class="step"><div class="n">' + (i + 1) + '</div><div><b>' + e(c.soru) + '</b> <span class="pill ' + cd[0] + '" style="font-size:12.5px">' + cd[1] + '</span><div style="margin-top:3px">' + e(c.cevap) + '</div>' + (c.kime && c.durum === 'gorusme' ? '<div class="meta">Kime: ' + e(c.kime) + '</div>' : '') + (c.kaynak ? '<div class="meta">' + linkify(c.kaynak) + '</div>' : '') + '</div></div>';
      }).join('') + '</div></div>';
    }
    if (t.acik_sorular && t.acik_sorular.length) h += '<div class="card"><div class="eyebrow">' + (t.cevaplar && t.cevaplar.length ? 'Kalan sorular (görüşme gerektirir)' : 'Açık sorular') + '</div><ul class="plain">' + t.acik_sorular.map(function (q) { return '<li>' + e(q) + '</li>'; }).join('') + '</ul></div>';
    if (t.riskler && t.riskler.length) h += '<div class="card"><div class="eyebrow">Riskler</div><ul class="plain">' + t.riskler.map(function (q) { return '<li>' + e(q) + '</li>'; }).join('') + '</ul></div>';
    if (t.takvim && t.takvim.length) h += '<div class="card"><div class="eyebrow">Bu konunun takvimi</div>' + tlHtml(t.takvim.map(function (x) { return { tarih: x.tarih, iso: x.iso, olay: x.olay, kaynak: x.kaynak }; })) + '</div>';
    if (t.celiskiler && t.celiskiler.length) h += '<div class="card soft"><div class="eyebrow">Çalışmalar arası çelişki</div><ul class="plain">' + t.celiskiler.map(function (q) { return '<li>' + e(q) + '</li>'; }).join('') + '</ul></div>';
    h += '<div class="card"><div class="eyebrow">Kaynaklar ve doğrulama</div>' +
      (t.kaynaklar && t.kaynaklar.length ? '<p class="tiny">Dayandığı bölümler: ' + t.kaynaklar.map(function (s) { return e(s.dosya) + ' (' + e(s.bolum) + (s.tarih ? ', ' + e(s.tarih) : '') + ')'; }).join(' · ') + '</p>' : '') +
      (t.web && t.web.length ? '<p class="tiny">Web kaynakları (' + e(D.derleme_tarihi) + '): ' + t.web.map(function (w) { return '<a href="' + e(w.url) + '" target="_blank" rel="noopener">' + e(w.ne) + '</a>'; }).join(' · ') + '</p>' : '') +
      (t.degisiklikler && t.degisiklikler.length ? '<details><summary>Doğrulama notları (' + t.degisiklikler.length + ')</summary><ul class="plain" style="margin-top:6px">' + t.degisiklikler.map(function (q) { return '<li class="tiny">' + e(q) + '</li>'; }).join('') + '</ul></details>' : '') + '</div>';
    h += '<div class="foot">Özet ' + e(D.derleme_tarihi) + ' tarihinde ' + e(t.tarih) + ' tarihli çalışmadan derlendi; kaynak çalışmanın hükümleri kendi tarihine göredir.</div>';
    return h;
  }

  function tlHtml(list) {
    var today = D.bugun_iso;
    var sorted = list.slice().sort(function (a, b) { return (a.iso || '9999') < (b.iso || '9999') ? -1 : 1; });
    return '<div class="tl">' + sorted.map(function (x) {
      var cls = 'ileri';
      if (x.iso) { if (x.iso < today) cls = 'gecti'; else if (x.iso === today) cls = 'bugun'; else if (daysBetween(today, x.iso) <= 30) cls = 'yakin'; }
      return '<div class="e ' + cls + '"><div class="d">' + e(x.tarih) + '</div><div class="dot"></div><div class="t">' + e(x.olay) + (x.konu_id && topic(x.konu_id) ? ' <a href="#/konu/' + x.konu_id + '">' + e(topic(x.konu_id).kisa || topic(x.konu_id).baslik) + '</a>' : '') + (x.kaynak ? '<small>' + e(x.kaynak) + '</small>' : '') + '</div></div>';
    }).join('') + '</div>';
  }
  function takvimHtml() {
    return '<a class="back" href="#/">‹ Ağaca dön</a><div><div class="eyebrow">Takvim</div><h1>Tarihi belli pencereler</h1><p class="muted">Gri geçti, turuncu 30 gün içinde, mavi ileride. Tarihler çalışmalardan alındı; ' + e(D.derleme_tarihi) + ' itibarıyla yeniden doğrulanmadı.</p></div><div class="card">' + tlHtml(D.takvim) + '</div>';
  }

  function docBtn(b, main) {
    var f = D.dosyalar[b.dosya]; if (!f) return '';
    return '<a class="docbtn' + (main ? ' main' : '') + '" href="pdf/' + e(f.pdf) + '" target="_blank" rel="noopener">' + e(b.etiket || f.kisa || f.ad) + (f.sayfa_sayisi ? ' · ' + f.sayfa_sayisi + ' sf.' : '') + '</a>';
  }
  function calismalarHtml() {
    var h = '<a class="back" href="#/">‹ Ağaca dön</a><div><div class="eyebrow">Çalışmalar</div><h1>Kaynak çalışmalar</h1><p class="muted">' + e(D.calismalar_notu) + '</p></div>';
    (D.calisma_gruplari || []).forEach(function (g) {
      h += '<div class="card"><div class="row" style="justify-content:space-between;align-items:baseline"><h3>' + e(g.ad) + '</h3><span class="tiny">' + e(g.tarih) + '</span></div><p class="muted">' + e(g.aciklama) + '</p>';
      if (g.yaprak_belgeleri) {
        h += '<div class="doclist">' + g.yaprak_belgeleri.map(function (x) {
          var t = topic(x.yaprak); if (!t) return '';
          return '<div class="docrow"><a href="#/konu/' + t.id + '">' + e(t.kisa || t.baslik) + '</a>' + docBtn({ dosya: x.dosya, etiket: 'Ek araştırma' }, false) + '</div>';
        }).join('') + '</div>';
      } else {
        h += '<div class="doclist">' + (g.belgeler || []).map(function (b) { return docBtn(b, b.rol === 'tam'); }).join('') + '</div>';
      }
      h += '</div>';
    });
    return h;
  }

  function neYapmaliHtml() {
    var h = '<a class="back" href="#/">‹ Ağaca dön</a><div><div class="eyebrow">Ne yapmalıyız</div><h1>Seçime göre ilk adımlar</h1><p class="muted">' + e(secimMetni()) + '</p></div>';
    h += gatesHtml();
    D.agac.forEach(function (br) {
      var r = region(br.id); if (!r) return;
      var steps = (r.ne_yapmali || []).filter(function (s) { var t = topic(s.konu_id); return !t || aktif(t); });
      h += '<div class="card"><div class="eyebrow">' + e(br.ad) + '</div><div class="steps">' + steps.map(function (s, i) {
        var t = topic(s.konu_id);
        return '<div class="step"><div class="n">' + (i + 1) + '</div><div>' + e(s.adim) + '<div class="meta">' + e(s.kim) + ' · ' + e(s.ne_zaman) + (t ? ' · <a href="#/konu/' + t.id + '">' + e(t.kisa || t.baslik) + '</a>' : '') + '</div></div></div>';
      }).join('') + (steps.length ? '' : '<p class="muted">Seçime uyan adım yok.</p>') + '</div></div>';
    });
    // görüşme listesi
    var gl = sirala(tumYapraklar()).filter(aktif).map(function (t) { return { t: t, g: (t.cevaplar || []).filter(function (c) { return c.durum === 'gorusme'; }) }; }).filter(function (x) { return x.g.length; });
    if (gl.length) {
      var toplam = gl.reduce(function (a, x) { return a + x.g.length; }, 0);
      h += '<div class="card"><div class="eyebrow">Görüşme listesi: kime ne sorulacak (' + toplam + ' soru)</div><p class="muted">Web araştırmasıyla kapanmayan sorular. Genel puanı yüksek yapraklar üstte.</p>' + gl.map(function (x) {
        return '<details><summary><b>' + e(x.t.kisa || x.t.baslik) + '</b> <span class="tiny">' + x.g.length + ' soru · genel puan ' + (genelPuan(x.t) == null ? '–' : Math.round(genelPuan(x.t))) + '</span></summary><div class="steps" style="margin-top:6px">' + x.g.map(function (c, i) {
          return '<div class="step"><div class="n">' + (i + 1) + '</div><div>' + e(c.soru) + '<div class="meta">Kime: ' + e(c.kime || 'belirtilmedi') + '</div></div></div>';
        }).join('') + '<a class="tiny" href="#/konu/' + x.t.id + '">Yaprağı aç ›</a></div></details>';
      }).join('') + '</div>';
    }
    h += '<div class="card"><div class="eyebrow">Her zaman</div><ul class="plain">' + D.sabit_adimlar.map(function (s) { return '<li>' + e(s) + '</li>'; }).join('') + '</ul></div>';
    return h;
  }

  // ---------------- yönlendirme ----------------
  function render() {
    var hash = location.hash.replace(/^#/, '') || '/';
    var html = ''; var m;
    try {
      if ((m = hash.match(/^\/bolge\/([\w-]+)/))) html = regionHtml(m[1]);
      else if ((m = hash.match(/^\/konu\/([\w-]+)/))) html = topicHtml(m[1]);
      else if (hash.indexOf('/siralama') === 0) html = siralamaHtml();
      else if (hash.indexOf('/takvim') === 0) html = takvimHtml();
      else if (hash.indexOf('/calismalar') === 0) html = calismalarHtml();
      else if (hash.indexOf('/ne-yapmali') === 0) html = neYapmaliHtml();
      else html = homeHtml();
    } catch (err) { html = '<div class="card"><b>Sayfa çizilemedi.</b><p class="muted">' + e(err && err.message) + '</p></div>'; }
    html += '<div class="row tiny" style="justify-content:space-between"><span>' + e(D.surum) + '</span><span><button type="button" class="btn" data-act="edit">' + (document.body.classList.contains('editing') ? 'Düzenlemeyi kapat' : 'Düzenle') + '</button> <button type="button" class="btn" data-act="export">Durumu dışa aktar</button> <label class="btn">Dosyadan yükle<input type="file" id="imp" accept="application/json,.json" hidden></label></span></div>';
    APP.innerHTML = html;
    document.querySelectorAll('#bar nav a').forEach(function (a) { var nv = a.getAttribute('data-nav'); a.classList.toggle('on', hash === nv || (nv !== '/' && hash.indexOf(nv) === 0)); });
    window.scrollTo(0, 0);
  }

  function dosyaAdi() { return 'durum.json'; }
  function disaAktar() {
    var json = JSON.stringify(birlesik(), null, 1);
    var file;
    try { file = new File([json], dosyaAdi(), { type: 'application/json' }); } catch (x) { file = null; }
    if (file && navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
      navigator.share({ files: [file], title: 'MEKA karar ağacı durumu' }).catch(function () {});
      return;
    }
    var blob = new Blob([json], { type: 'application/json' }); var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = dosyaAdi(); document.body.appendChild(a); a.click(); a.remove();
  }
  function iceAktar(text) {
    var j; try { j = JSON.parse(text); } catch (x) { alert('Dosya okunamadı.'); return; }
    Object.keys(j).forEach(function (id) {
      var src = j[id] || {}, y = yer(id);
      SKALER.forEach(function (k) { if (!bos(src[k])) y[k] = src[k]; });
      var have = {}; (y.notlar || []).forEach(function (n) { have[n.t + '|' + n.m] = 1; });
      var ek = uzak[id] && uzak[id].notlar || []; ek.forEach(function (n) { have[n.t + '|' + n.m] = 1; });
      (src.notlar || []).forEach(function (n) { if (!have[n.t + '|' + n.m]) { (y.notlar = y.notlar || []).push({ t: n.t, m: n.m }); have[n.t + '|' + n.m] = 1; } });
    });
    saveYerel(); render();
  }

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.gate) {
      if (b.dataset.gate === 'profil') { PROFIL = b.dataset.val; lsSet('meka_profil', PROFIL); }
      else { sel[b.dataset.gate] = b.dataset.val; saveSel(); }
      var y = window.scrollY; render(); window.scrollTo(0, y); return;
    }
    var act = b.dataset.act; if (!act) return;
    if (act === 'edit') { document.body.classList.toggle('editing'); var y2 = window.scrollY; render(); window.scrollTo(0, y2); return; }
    if (act === 'export') { disaAktar(); return; }
    if (act === 'nota-ekle') {
      var id = b.dataset.id; var ta = document.getElementById('not-' + id); var m = ta && ta.value.trim(); if (!m) return;
      var yy = yer(id); (yy.notlar = yy.notlar || []).push({ t: new Date().toISOString(), m: m }); saveYerel();
      var ys = window.scrollY; render(); window.scrollTo(0, ys); return;
    }
    if (act === 'nota-sil') {
      var yd = yer(b.dataset.id); var i = Number(b.dataset.i);
      if (yd.notlar && yd.notlar[i]) { yd.notlar.splice(i, 1); saveYerel(); var yk = window.scrollY; render(); window.scrollTo(0, yk); }
      return;
    }
    if (act === 'kaydet') {
      var id2 = b.dataset.id; var box = b.closest('.card'); var d = yer(id2);
      d.durum = box.querySelector('[data-ed=durum]').value; d.ilerleme = box.querySelector('[data-ed=ilerleme]').value;
      d.gorevler = box.querySelector('[data-ed=gorevler]').value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) { var done = /^x\s+/i.test(l); return { ad: l.replace(/^x\s+/i, ''), bitti: done }; });
      d.not = box.querySelector('[data-ed=not]').value;
      d.saha_puan = box.querySelector('[data-ed=saha_puan]').value; d.saha_not = box.querySelector('[data-ed=saha_not]').value; d.saha_tarih = box.querySelector('[data-ed=saha_tarih]').value;
      saveYerel(); var y3 = window.scrollY; render(); window.scrollTo(0, y3); return;
    }
  });
  document.addEventListener('change', function (ev) {
    if (ev.target && ev.target.id === 'imp' && ev.target.files && ev.target.files[0]) {
      var rd = new FileReader(); rd.onload = function () { iceAktar(String(rd.result)); }; rd.readAsText(ev.target.files[0]);
    }
  });
  window.addEventListener('hashchange', render);
  render();
  // Sitenin kökünde durum.json varsa (yöneticinin dışa aktardığı işaretler ve notlar) herkes için yükle
  try {
    fetch('durum.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j) return; uzak = j;
      var ae = document.activeElement; if (ae && (ae.tagName === 'TEXTAREA' || ae.tagName === 'INPUT')) return;
      render();
    }).catch(function () {});
  } catch (x) {}
})();
