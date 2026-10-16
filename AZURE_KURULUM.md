# MEKA Karar Ağacı: yayın ve güncelleme

**Yayında:** https://cimenulas-boop.github.io/meka-agac/ (GitHub Pages, depo: https://github.com/cimenulas-boop/meka-agac, public, 16 Ekim 2026). Sayfa `noindex` etiketli; arama motorları listelemez ama linki bilen herkes açar.

Uygulama tamamen statik: `index.html`, `app.js`, `data.js`, `pdf/` klasörü ve isteğe bağlı `durum.json`. Sunucu tarafı kod yok, veritabanı yok.

## Günlük kullanım: notlar, işaretler ve saha puanı

1. **Notlar** her yaprakta ayrı kartta, düzenleme moduna gerek yok: yaz, **Notu ekle**. Not bu cihazda saklanır.
2. **İlerleme, görevler ve saha puanı** için sayfanın altındaki **Düzenle** düğmesine bas, yaprağı aç, Durum kartını doldur, **Kaydet**. Saha puanı 1 ile 5: 3 nötr, 5 genel puana 10 puan ekler, 1 on puan düşürür.
3. Herkesin görmesi için sayfanın altındaki **Durumu dışa aktar** düğmesine bas (telefonda paylaşım menüsü açılır, WhatsApp'a gönderebilirsin; bilgisayarda `durum.json` iner).
4. GitHub deposunda **Add file > Upload files**, `durum.json` dosyasını köke (index.html'in yanına) bırak, **Commit changes**. Aynı adla yüklemek eskisinin üzerine yazar. 1-2 dakika sonra herkes aynı not ve işaretleri görür. Yeni telefonda **Dosyadan yükle** ile aynı dosyayı geri yükleyebilirsin.

## İçerik güncellemesi

`data.js`, `app.js` ya da `pdf/` klasöründeki dosyalar değişince aynı yoldan (Upload files, aynı klasöre) yükle; üzerine yazar. Claude yeni çalışma eklediğinde sana güncellenmiş dosyaları verir ya da Chrome üzerinden kendisi yükler.

## Başka bir yere taşımak gerekirse

## En kısa yol: GitHub Pages, tarayıcıdan (kurulum gerekmez)

1. github.com'da giriş yapın, **New repository**: ad `meka-agac`, görünürlük **Public** (ücretsiz hesapta Pages yalnız public depodan yayınlanır; içerik herkese açık olur, link bilmeyen bulmaz ama gizli değildir. Private depo için GitHub Pro ya da Team gerekir).
2. Depo sayfasında **Add file > Upload files**: bu klasörün içindekileri (index.html, app.js, data.js, AZURE_KURULUM.md ve `pdf` klasörünü) sürükleyip bırakın, **Commit changes**.
3. **Settings > Pages > Build and deployment**: Source *Deploy from a branch*, Branch *main*, klasör */ (root)*, **Save**.
4. Bir iki dakika sonra adres: `https://<kullanici-adi>.github.io/meka-agac/`. Bu linki ekibe gönderin.

Güncelleme: değişen dosyayı aynı yoldan tekrar yükleyin (Upload files, üzerine yazar).

## Render (statik site, ücretsiz)

1. Önce yukarıdaki gibi bir GitHub deposu olsun (Render depodan okur; zip kabul etmez).
2. render.com'da **New > Static Site**, GitHub hesabını bağlayın, `meka-agac` deposunu seçin. Build command boş, Publish directory `.`.
3. Adres `https://meka-agac.onrender.com` biçiminde olur. Depoya her yüklemede kendiliğinden yenilenir. Render'da depo private de olabilir.

## Azure Static Web Apps (ücretsiz katman yeter)

1. Azure portalında **Static Web App** oluşturun: Plan *Free*, dağıtım kaynağı *Other* (GitHub gerekmez).
2. Bilgisayarınızda Node.js varsa SWA CLI ile yükleyin:

```bash
npm install -g @azure/static-web-apps-cli
```

```bash
swa deploy ./meka_agac --env production --deployment-token <PORTALDAN_KOPYALANAN_TOKEN>
```

   Token: portalda Static Web App > *Overview* > *Manage deployment token*.
3. Adres `https://<isim>.azurestaticapps.net` olur. Ekibe bu linki gönderin; telefon tarayıcısında açılır.
4. Erişimi kısıtlamak isterseniz: *Standard* plana geçip Entra ID (şirket hesabı) ile oturum zorunluluğu koyabilirsiniz. Free planda herkese açık olur; link bilmeyen bulamaz ama gizli değildir.

## Seçenek 2: Azure Storage statik web sitesi

1. Bir Storage hesabı açın (StorageV2). *Static website* özelliğini açın, index belgesi `index.html`.
2. `$web` kapsayıcısına klasörün içeriğini yükleyin (portaldan sürükle bırak ya da Azure Storage Explorer).
3. Adres `https://<hesap>.z6.web.core.windows.net/` biçiminde olur.

## Seçenek 3: Mevcut bir IIS ya da Linux sunucu

Klasörü olduğu gibi kopyalayın. `.pdf` ve `.js` için MIME türleri standarttır; ek ayar gerekmez.

## Güncelleme nasıl yapılır

- **İçerik** (`data.js`): yeni çalışma eklenince ya da özetler düzeltilince Claude Code ile yeniden üretilir; dosyayı değiştirip tekrar yüklemek yeter.
- **İlerleme ve görevler**: uygulamada *Düzenle* ile işaretleyin, *Durumu dışa aktar* ile `durum.json` indirin, bu dosyayı sitenin kök klasörüne koyup yükleyin. Herkes aynı durumu görür. İşaretler yüklenmeden önce yalnızca o cihazda kalır.
- **Yeni PDF**: `pdf/` klasörüne koyun ve `data.js` içindeki `dosyalar` ya da `calismalar` listesine ekleyin.

## Dosya listesi

```
meka_agac/
  index.html          uygulama (tek dosya)
  data.js             39 yaprak, 8 bölge, takvim, çalışmalar
  durum.json          (isteğe bağlı) yöneticinin işaretlediği durum
  AZURE_KURULUM.md    bu dosya
  pdf/                14 PDF: savunma raporu ve özetleri, 02-10 çalışmaları, GPT kartı, poster
```
