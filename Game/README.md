# RPG Sonsuz Av

`RPG Sonsuz Av`, tarayıcıda çalışan 2D idle/action RPG prototipidir. Oyun vanilla HTML, CSS ve JavaScript ile yazılmıştır. Sunucu tarafında Node.js kullanılır; kullanıcı ve karakter kayıtları webde değil, proje klasöründeki yerel SQLite veritabanında tutulur.

## Oyunun Amacı

Oyuncu bir okçu karakteri geliştirerek sürekli güçlenen düşmanlara karşı ilerler. Karakter otomatik saldırır, düşmanlar uzaktan yaklaşır ve temas mesafesine geldiklerinde saldırmaya başlar.

Ana döngü:

1. Kullanıcı adı ve şifre ile giriş yap veya yeni hesap oluştur.
2. Karakter düşmanlarla otomatik savaşır.
3. Düşman öldürerek XP, altın ve düşük ihtimalle item kazan.
4. Altınla karakter özelliklerini ve dükkan eşyalarını geliştir.
5. Itemleri giy, kilitle, parçala, yok et veya parçaların tierine göre craft yap.
6. XP eşiğini doldurdukça level atla ve daha yüksek savaş seviyelerine geç.
7. Bestiary üzerinden düşman geçmişini, öldürme sayısını ve drop bilgisini takip et.

## Başlatma

Proje klasöründe:

```powershell
npm start
```

Oyun varsayılan olarak burada açılır:

```text
http://127.0.0.1:5173
```

Bu proje Python server ile başlatılmaz. `npm start`, `server.js` dosyasını çalıştırır; hem statik dosyaları servis eder hem de kayıt API'lerini açar.

## Durdurma

Server açık terminalde çalışıyorsa:

```text
Ctrl + C
```

Terminal görünmüyorsa 5173 portunu kullanan işlemi bulup kapat:

```powershell
netstat -ano | Select-String ':5173'
Stop-Process -Id <PID>
```

`<PID>` yerine `LISTENING` satırının sonundaki process id yazılır.

## Kayıt ve Veritabanı

Ana kayıt veritabanı:

```text
data/game.db
```

İlk SQLite geçişinde eski JSON kaydı otomatik yedeklenir:

```text
data/users.backup-before-sqlite.json
```

Eski `data/users.json` dosyası artık ana veritabanı değildir; geçiş ve geri dönüş güvenliği için yerinde bırakılır.

SQLite tablo yapısı:

- `users`: kullanıcı adı, şifre salt/hash, oluşturulma ve güncellenme tarihleri
- `characters`: karakter özeti, stage durumu, altın, ayarlar ve tam `saveData` JSON kaydı
- `inventory_items`: envanterdeki itemler, adet, kilit, kaynak ve item JSON verisi
- `equipped_items`: giyili ekipman slotları
- `bestiary`: düşman öldürme/drop istatistikleri
- `shop_stock`: kullanıcıya özel dükkan stoğu

Kaydedilen ana veriler:

- Kullanıcı adı ve şifre hash bilgisi
- Karakter leveli, XP, can, hasar ve saldırı hızı
- Altın miktarı
- Açık stage, seçili stage ve stage içi düşman ilerlemesi
- Envanter sırası, item kilitleri, item miktarları
- Giyili ekipmanlar
- Dükkan stoğu
- Aktif iksirler ve kalan süreleri
- Bestiary istatistikleri
- Ses ayarı
- Mevcut düşman durumu

Şifre düz metin saklanmaz. `server.js`, salt kullanılan SHA-256 hash üretir ve kullanıcı verisini yerel SQLite veritabanına yazar.

## Giriş Ekranı

Giriş ekranında:

- Solda ana karakter görseli
- Sağda dükkan görevlisi
- Arkada savaş alanı arka planı
- `Giriş` ve `Kayıt Ol` aksiyonları

Kullanıcı giriş yaptıktan sonra karakter kaydı yüklenir. `Çıkış` karakteri kaydedip giriş ekranına döndürür. `Sıfırla` karakter ilerlemesini baştan başlatır.

## Arayüz

Header alanında:

- Kullanıcı adı
- Kayıt durumu
- Ses aç/kapat düğmesi
- Sıfırlama ve çıkış düğmeleri
- XP barı
- Altın miktarı

Sol panelde:

- Altınla alınan karakter geliştirmeleri
- Bestiary / düşman test listesi

Orta alanda:

- Savaş sahnesi
- Karakter ve düşman animasyonları
- İnce can barları
- Stage yol haritası

Sağ panelde sekmeler:

- `Durum`: Karakterin özet bilgileri ve idle görünümü
- `Dükkan`: Satın alma, stok yenileme ve dükkan görevlisi
- `Birleştir`: Craft slotları, rastgele üretim özeti ve envanter
- `Bestiary`: Düşman ansiklopedisi ve test listesi
- `Liderlik`: Hesapların level ve güç sıralaması

## Stage, Level ve XP Sistemi

Oyun ilerleyişi artık stage sistemiyle yürür. Stage'ler 1'den başlayıp teorik olarak sonsuza kadar devam eder. Yol haritası 50'lik bloklarla gösterilir:

```text
Stage 1-50, Stage 50-100, Stage 100-150, ...
```

Kurallar:

- Her stage içinde belirli sayıda düşman vardır.
- Stage ilerledikçe gereken düşman sayısı ve düşman gücü artar.
- Stage içindeki tüm düşmanlar ölünce ekranda `Stage Geçildi` bildirimi çıkar.
- Stage geçilince karakter kısa süre yürür, arka plan hareket eder ve sonraki stage savaşı başlar.
- Stage geçiş molasında karakter az miktarda can yeniler; tek tek düşman öldürmede can yenilenmez.
- Stage geçilemeden ölünürse aynı stage en baştan başlar.
- Açılmış stage'lere tıklanarak eski stage'ler tekrar oynanabilir.
- XP eşiği her levelde artar.
- XP dolunca karakter otomatik level atlar.
- Karakter leveli stage kilidini otomatik açmaz; stage ilerlemesi stage geçerek açılır.
- Karakter kendi levelinden düşük düşmanlarla savaşırsa XP, altın ve drop verimi kademeli düşer.
- Ölünce XP kaybı yaşanır; düşük stage alanında ölünürse kayıp daha az olur.

## Savaş Sistemi

Karakter otomatik ok atar. Ok, karakterin yayıyla hizalı şekilde çıkar. Düşmanlar uzaktan karaktere doğru hareket eder ve yakın temasa gelince saldırır.

Düşman hasar alınca:

- Hafif kızarır.
- Üstünde küçük hasar sayısı görünür.
- Can barı ve isim etiketi sprite boyuna göre hizalanır.

Karakter ölünce:

- 3 saniyelik sayaç gösterilir.
- Karakter tam canla yeniden doğar.
- Altın azalmaz.
- Aynı stage en baştan başlar; stage içindeki öldürme sayacı sıfırlanır.
- XP cezası uygulanır.

## Düşmanlar ve Bestiary

Mevcut düşman havuzu:

- Hallokin
- VFX Yarasa
- Kör Avcı
- Bataklık Gölgesi
- Minotor
- Boşluk Azraili
- İskelet Savaşçı
- Kızıl Şövalye
- Nekromant

Bestiary sistemi düşmanları kalıcı ansiklopedi gibi takip eder:

- Öldürme sayısı
- Drop sayısı
- En yüksek görülen level
- Son düşen item
- Zayıflık bilgisi
- Genel drop bilgisi

Sol paneldeki düşman listesine tıklayarak seçilen düşmanı test amaçlı savaşa çağırabilirsin. Bu özellik animasyon ve savaş denemeleri için eklendi.

## Item ve Tier Sistemi

Oyundaki item görselleri tek klasörde toplanmıştır:

- `assets/item-icons/`: 478 PNG
- Dosya adları kaynak çakışmasını önlemek için `pack1-`, `pack2-`, `pack3-`, `boot-`, `material-`, `fa-` prefixleriyle tutulur.

Toplam katalogda ekipman, iksir ve malzemelerle birlikte 485 item bulunur.

Item isimlerini kolay değiştirmek için [src/data/itemNames.js](src/data/itemNames.js) dosyasındaki `itemNameOverrides` alanını düzenleyebilirsin. Anahtar item id, değer oyunda görünen isimdir.

Tier sistemi:

| Tier | İsim | Mantık |
| --- | --- | --- |
| T1 | Sıradan | Kolay bulunur, düşük stat |
| T2 | Kaliteli | Erken oyun güçlenmesi |
| T3 | Nadir | Orta seviye ekipman |
| T4 | Destansı | Pahalı ve zor bulunan itemler |
| T5 | Efsanevi | Çok güçlü, çok nadir |
| T6 | Çok Efsanevi | Aşırı nadir, yüksek seviye hedef itemleri |
| T7 | İlahi | 400+ level bandında açılan üst seviye itemler |
| T8 | Kadim | 560+ level bandında ağır ekonomi eşiği |
| T9 | Mistik | 740+ level sonrası çok nadir drop |
| T10 | Astral | 950+ level sonrası ileri oyun itemleri |
| T11 | Kozmik | 1200+ level sonrası yüksek güç |
| T12 | Ebedi | 1500+ level sonrası çok pahalı itemler |
| T13 | Cehennem | 1850+ level sonrası aşırı nadir |
| T14 | Goksel | 2250+ level sonrası prestij itemleri |
| T15 | Mutlak | 2700+ level sonrası en üst hedef itemler |

Tier arttıkça:

- Renk/parlaklık daha belirgin olur.
- Düşme ihtimali azalır.
- Dükkan fiyatı yükselir.
- Level gereksinimi artar.
- Parçalama sonucu daha değerli malzeme verir.

T8+ itemler yüksek level kapısına ve çok yüksek dükkan fiyatlarına sahiptir. T15 itemlerin drop ağırlığı sistemdeki en düşük değerdir.

## Envanter

Envanterdeki itemler kare kartlar halinde görünür. Kartlarda ikon, isim, tier, level gereksinimi, stat bilgisi ve miktar rozeti bulunur.

Özellikler:

- Itemleri sürükleyerek envanter sırasını değiştirebilirsin.
- Ekipmanı `Giy` ile takabilirsin; giyili eşyalar envanterden gizlenir ve `Kuşanım` alanından çıkarılır.
- Sol paneldeki `Kuşanım` kartına sürükleyerek de giydirebilirsin.
- Level gereksinimi yüksek itemler giyilemez.
- Materyaller miktarlı stack olarak tutulur.

## Item Karşılaştırma Paneli

Item kartının üstüne gelince karşılaştırma paneli açılır. Panel mevcut ekipmanla farkı gösterir:

- Hasar farkı
- Can farkı
- Saldırı hızı farkı
- Item tieri ve level gereksinimi

Pozitif değerler yeşil, negatif değerler kırmızı gösterilir.

## Item Kilitleme

Yanlışlıkla item kaybetmeyi önlemek için kilitleme sistemi vardır.

Kilitli item:

- Parçalanamaz.
- Yok edilemez.
- Craft slotunda tüketilemez.
- Kart üzerinde `Kilitli` etiketi taşır.

Kilit açıldıktan sonra item normal şekilde kullanılabilir.

## Dükkan

Dükkanda ekipman ve iksir satılır. Dükkan stoğu karakter kaydında saklanır.

Kurallar:

- Düşük tier itemler daha erişilebilirdir.
- T4 ve üstü itemler ciddi altın ister.
- T6 itemler yüksek level kapısına bağlıdır.
- T7 itemler 400+ level kapısına bağlıdır ve dükkan fiyatları çok yüksektir.
- İksirler ucuz tüketim eşyası değildir; satın almak planlama ister.
- Item satın alınınca yerine daha pahalı ve çoğunlukla daha iyi yeni item gelir.
- `Yenile` düğmesiyle belli miktar altın ödeyerek stok tamamen değiştirilebilir.
- Yenileme maliyeti karakter leveli ve aktif stage'e göre artar.

## İksir Sistemi

İksirler envanterden `İç` butonuyla kullanılır. Etkiler geçicidir ve süre bitince otomatik kalkar.

İksir etkileri:

- Geçici hasar
- Geçici saldırı hızı
- Geçici maksimum can

Aktif iksirler kayda yazılır; oyuna tekrar girildiğinde kalan süreye göre geri yüklenir.

## Parçalama ve Malzemeler

Item parçalandığında envantere malzeme düşer. Ayrı taş sayacı yoktur; her malzeme normal item kartı gibi görünür.

Malzeme örnekleri:

- Dal Parçası
- Bakır Cevheri
- Bakır Külçesi
- Demir Cevheri
- Demir Külçesi
- Gümüş Cevheri
- Gümüş Külçesi
- Altın Cevheri
- Altın Külçesi
- Platin Cevheri
- Platin Külçesi

Tier mantığı:

- Düşük tier itemler düşük tier malzeme bırakır.
- Yüksek tier itemler gümüş, altın ve platin malzemelere geçer.
- T6 itemler ağırlıklı olarak platin ve altın malzemeler verir.
- T7 itemler en yüksek miktarda platin ve altın malzeme verir.

## Craft Sistemi

Craft sistemi oyuncunun slotlara sürüklediği parçaların tier ortalamasına göre rastgele item üretir. Parçalar otomatik eklenmez; oyuncu hangi malzemeyi kullanacağını kendisi seçer.

Üretim sonucu:

- Slotlardaki 3 parçanın ortalama tier seviyesine bakılır.
- Sonuç çoğunlukla bu ortalama tierden gelir.
- Düşük ihtimalle bir tier aşağı veya yukarı kayabilir.
- T7 üretim için T7 ağırlıklı malzeme kullanmak gerekir.

Craft kuralları:

- 3 slot dolmadan üretim yapılamaz.
- Parçalar otomatik yerleşmez; kullanıcı sürükleyerek veya `Ekle` butonuyla koyar.
- Envanterdeki miktardan fazlası slota konamaz.
- Üretim başarılı olunca kullanılan malzemeler envanterden düşer.
- Kilitli malzemeler craftta kullanılamaz.

## Ses ve Bildirimler

Ses efektleri:

- Ok atışı
- Hasar alma/verme
- Item düşüşü
- Level atlama
- Stage geçme

Header'daki `Ses Açık / Ses Kapalı` düğmesiyle sesler kapatılıp açılabilir. Ayar kayda yazılır.

Toast bildirimleri sağ altta görünür:

- Nadir item düştü
- Level açıldı
- Stage geçildi
- Dükkan yenilendi
- Craft sonucu oluştu

## Dosya Yapısı

```text
Game/
  assets/
    background-layers/   Savaş alanı arka plan katmanları
    boots/               Bot ekipman ikonları
    characters/          Ana karakter sprite dosyaları
    enemies/             Düşman sprite dosyaları
    items/               İlk item ikon paketi
    items2/              İkinci item ikon paketi
    materials/           Craft/parçalama malzemeleri
    monsters/            Eski/ek varlık dosyaları
    npc/                 Dükkan görevlisi görselleri
    ui/                  Kart ve panel arka plan dokuları
    video/               Arka plan video varlıkları
  data/
    game.db              Yerel SQLite kullanıcı ve karakter veritabanı
    users.json           Eski JSON kayıt dosyası, SQLite geçişinden sonra yedek amaçlı kalır
    users.backup-before-sqlite.json
                         SQLite geçişinden önce alınan otomatik JSON yedeği
  src/
    data/
      enemies.js         Düşman tanımları, animasyonlar, zayıflık ve drop bilgileri
      items.js           Item katalogları, tier ayarları, malzemeler ve craft dengesi
    systems/
      audio.js           Web Audio tabanlı ses sistemi
      combat.js          Savaş/sahne yardımcı hesapları
      economy.js         XP, altın, ölüm cezası, dükkan ve upgrade maliyetleri
      inventory.js       Item okuma/helper fonksiyonları
    ui/
      toast.js           Sağ alt mini bildirim sistemi
    game.js              Ana oyun akışı, state, render ve event bağlama
  index.html             Ana arayüz
  styles.css             Tüm görsel stil
  server.js              Node statik server ve kayıt API'leri
  package.json           npm start komutu
```

## API Uçları

```text
POST /api/register
POST /api/login
POST /api/save
```

## Geliştirici Notları

- Proje vanilla JavaScript ile yazılmıştır.
- Dış npm paketi gerektirmez.
- `npm install` zorunlu değildir.
- `index.html`, `src/game.js` dosyasını ES module olarak yükler.
- `package.json` CommonJS kalır çünkü `server.js` Node tarafında `require` kullanır.
- Düşman animasyon ayarları `src/data/enemies.js` içindedir.
- Item, tier, malzeme ve craft ayarları `src/data/items.js` içindedir.
- Ekonomi formülleri `src/systems/economy.js` içinde tutulur.
- Yeni sistem eklerken mümkünse `game.js` içine büyük data blokları koyma; data ve saf helperları ilgili modüle taşı.

## Hızlı Doğrulama

Sözdizimi kontrolü için:

```powershell
Get-Content src\game.js -Raw | node --input-type=module --check -
Get-Content src\data\items.js -Raw | node --input-type=module --check -
Get-Content src\data\enemies.js -Raw | node --input-type=module --check -
Get-Content src\systems\economy.js -Raw | node --input-type=module --check -
Get-Content src\systems\inventory.js -Raw | node --input-type=module --check -
Get-Content src\systems\combat.js -Raw | node --input-type=module --check -
Get-Content src\systems\audio.js -Raw | node --input-type=module --check -
Get-Content src\ui\toast.js -Raw | node --input-type=module --check -
node --check server.js
```

## Olası Sonraki Geliştirmeler

- Bestiary ödülleri: belirli öldürme sayılarında kalıcı bonuslar
- Düşman aileleri ve element sistemi
- Craft sonucunu önizleyen daha detaylı olasılık paneli
- Item yükseltme ve yeniden dövme sistemi
- Boss level blokları
- Nadir drop için özel ekran efekti
- Ses ayarlarına ayrı efekt/müzik seviyesi
- Debug düşman test listesini sadece geliştirici modunda gösterme

