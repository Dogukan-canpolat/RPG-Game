
# RPG Sonsuz Av
<img width="320" height="340" alt="gifgit (1)" src="https://github.com/user-attachments/assets/3ba4e4ab-2f66-4824-a800-faf98361c0cd" /> 
`RPG Sonsuz Av`, tarayıcıda çalışan 2D idle/action RPG prototipidir. Oyun vanilla HTML, CSS ve JavaScript ile yazılmıştır. Kayıtlar tarayıcı local storage içinde değil, proje klasöründeki yerel JSON veritabanında tutulur.

## Oyunun Amacı

Oyuncu bir okçu karakterle düşmanlara karşı otomatik savaşır. Düşmanlar uzaktan yaklaşır, karakterin yanına gelince saldırmaya başlar. Oyuncu XP, altın, ekipman, iksir ve üretim parçaları toplayarak daha yüksek savaş levellerine ilerler.

Ana döngü:

1. Kullanıcı adı ve şifre ile giriş yap veya yeni hesap oluştur.
2. Karakter düşmanlarla otomatik savaşır.
3. Düşman öldükçe XP ve altın kazanılır.
4. Nadir ihtimalle item düşer.
5. Itemler giyilir, parçalanır, yok edilir veya üretimde kullanılır.
6. Altınla can, hasar ve saldırı hızı geliştirilir.
7. XP eşiği dolunca karakter level atlar ve savaş leveli otomatik yükselir.

## Başlatma

Projeyi başlatmak için proje klasöründe çalıştır:

```powershell
npm start
```

Oyun varsayılan olarak şu adreste açılır:

```text
http://127.0.0.1:5173
```

Bu proje Python server ile başlatılmaz. `npm start`, `server.js` dosyasını çalıştırır; hem statik dosyaları servis eder hem de kayıt API'lerini açar.

## Durdurma

Server açık terminalde çalışıyorsa:

```text
Ctrl + C
```

Terminal görünmüyorsa 5173 portundaki işlemi bulup kapat:

```powershell
netstat -ano | Select-String ':5173'
Stop-Process -Id <PID>
```

`<PID>` yerine `LISTENING` satırının sonundaki process id yazılır.

## Kayıt ve Veritabanı

Kayıtlar şu dosyada tutulur:

```text
data/users.json
```

Saklanan temel veriler:

- Kullanıcı adı
- Şifre salt ve hash değeri
- Karakter leveli, XP ve sonraki XP eşiği
- Can, hasar, saldırı hızı
- Altınla alınan geliştirmeler
- Altın miktarı
- Envanter ve giyili ekipmanlar
- Dükkan stoğu
- Aktif iksirler ve kalan süreleri
- Savaş leveli ve açık level
- Mevcut düşman durumu

Şifre düz metin saklanmaz. Server tarafında salt'li SHA-256 hash kullanılır. `server.js`, `users.json` dosyasındaki UTF-8 BOM karakterini temizleyerek okur.

## Giriş Sistemi

Oyun açıldığında önce giriş ekranı gelir.

- `Kayıt Ol`: Yeni kullanıcı ve karakter oluşturur.
- `Giriş`: Var olan karakteri yükler.
- `Çıkış`: Karakteri kaydeder ve giriş ekranına döner.
- `Sıfırla`: Karakter leveli, altın, envanter, ekipman, dükkan stoğu ve savaş ilerlemesini sıfırlar.

## Otomatik Kayıt

Oyun şu durumlarda kayıt alır:

- Düşmana vurunca
- Düşmandan hasar alınca
- Düşman öldürülünce
- XP, altın veya loot kazanılınca
- Level değişince
- Dükkan alışverişi yapılınca
- Ekipman giyilip çıkarılınca
- Item parçalanınca veya yok edilince
- İksir içilince veya etkisi bitince
- Üretimle yeni item oluşturulunca
- Karakter ölünce veya yeniden doğunca
- Belirli aralıklarla otomatik kayıt zamanı gelince

Kayıt durumu header içindeki kullanıcı kutusunda görünür.

## Level ve XP Sistemi

Karakter XP kazandıkça level atlar. Her levelde gereken XP artar, bu yüzden ilerleme gittikçe zorlaşır. XP ödülü düşman leveli ile karakter leveli arasındaki farka göre hesaplanır.

- Karaktere yakın veya daha yüksek level düşman normal ya da bonus XP verir.
- Çok düşük level düşmanlar çok az XP verir.
- XP sınırı dolunca savaş leveli otomatik olarak karakter leveline geçer.
- Level yolunda açılmış levellere tıklanarak önceki veya mevcut seviyelerde savaşılabilir.
- Kilitli levela tıklanınca XP gerektiği mesajı gösterilir.

Level yolu 50'lik bloklarla gösterilir: `1-50`, `50-100`, `100-150` şeklinde devam eder.

## Savaş Sistemi

Karakter otomatik ok atar. Düşman uzaktan yaklaşır ve yakın mesafeye geldiğinde saldırır. Düşmanın saldırı mesafesi görsel olarak daha yakın temas hissi verecek şekilde ayarlanmıştır.

Düşman hasar aldığında:

- Hafif kızarır.
- Üstünde küçük hasar sayısı görünür.
- Ölürse XP, altın ve düşük ihtimalle item kazandırır.

Karakter ölürse:

- Ekranda 3 saniyelik sayaç görünür.
- Karakter canı full şekilde yeniden doğar.
- Altın azalmaz.
- Düşmanın canı sıfırlanmaz; böylece bölüm geçilebilir.

## Düşmanlar

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

Sol panelde geçici düşman test listesi bulunur. Bu liste, düşman animasyonlarını ve savaş davranışlarını hızlı test etmek için eklendi; ileride kaldırılabilir.

## Can Barı ve İsim Etiketleri

Düşman can barı ve isim etiketi sprite boyu ile ground offset değerine göre otomatik hizalanır. Böylece büyük veya küçük düşmanlarda etiketlerin çok yukarıda ya da çok aşağıda kalması engellenir.

## Item ve Tier Sistemi

Itemler 5 tier seviyesine sahiptir:

1. T1 Sıradan
2. T2 Kaliteli
3. T3 Nadir
4. T4 Destansı
5. T5 Efsanevi

Tier arttıkça:

- Itemin rengi daha belirgin parlar.
- Düşme ihtimali azalır.
- Dükkan fiyatı ciddi artar.
- Parçalandığında daha değerli malzeme bırakır.

Itemler kare kartlar halinde gösterilir. Kartlarda item ikonu, isim, tier, level gereksinimi, bonuslar ve fiyat bilgisi bulunur.

## Envanter ve Ekipman

Ekipman slotları:

- Silah
- Zırh
- Başlık
- Eldiven
- Yüzük

Oyuncu itemleri:

- `Giy` butonu ile takabilir.
- `Çıkar` butonu ile çıkarabilir.
- Ekipman paneline sürükleyerek takabilir.
- `Parçala` butonu ile malzemeye dönüştürebilir.
- `Yok Et` butonu ile ödülsüz silebilir.

Itemin level gereksinimi karakter levelinden yüksekse item giyilemez.

## Dükkan

Dükkanda ekipman ve iksir satılır. Dükkan fiyatları özellikle yüksek tier itemlerde zorlayıcıdır.

- T4 Destansı item almak için ciddi altın biriktirmek gerekir.
- T5 Efsanevi itemler çok daha pahalıdır.
- İksirler de kolay tüketilebilir ucuz itemler olmaktan çıkarılmıştır.
- Dükkandan item alınca stoktaki item kalkar.
- Yerine daha pahalı ve çoğunlukla daha güçlü yeni item gelir.
- Dükkan stoğu karakter kaydında saklanır.

## İksir Sistemi

İksirler envanterde `İç` butonu ile kullanılır. Etkileri geçicidir.

İksir türleri:

- Güç iksirleri geçici hasar verir.
- Hız iksirleri geçici saldırı hızı verir.
- Muhafız iksiri geçici maksimum can verir.

Etki süresi bitince bonus otomatik kalkar ve kayıt güncellenir.

## Parçalama ve Malzemeler

Item parçalandığında envantere malzeme düşer.

- Düşük tier itemler genelde 2 parça verir.
- Yüksek tier itemler genelde 3 parça verir.
- Düşük tier itemlerden dal, bakır ve demir parçaları gelir.
- Yüksek tier itemlerden gümüş, altın ve platin parçaları gelir.

Ayrı taş sayacı yoktur; tüm malzemeler envanterde item kartı olarak görünür.

## Birleştirme Sistemi

Birleştirme panelinde 3 malzeme slotu bulunur. Malzemeler otomatik yerleşmez; oyuncu envanterden sürükleyerek veya `Ekle` butonuyla slotlara koyar.

Kurallar:

- Aynı malzeme kartı birden fazla slota konamaz.
- 3 slot dolmadan üretim yapılamaz.
- Üretim sonunda kullanılan malzemeler envanterden silinir.
- Yeni itemin tier seviyesi kullanılan malzemelerin ortalama tier değerine göre belirlenir.

## Karakter Geliştirme

Level atlayınca stat puanı verilmez. Karakter geliştirmeleri altınla alınır.

Geliştirilebilir özellikler:

- Can
- Hasar
- Saldırı hızı

Her satın alma sonrası aynı geliştirmenin maliyeti artar.

## Arayüz
<img width="320" height="350" alt="gifgit" src="https://github.com/user-attachments/assets/67aaf65b-ed5b-4695-b567-f829fa56bbca" />

Header içinde:

- Kayıt durumu
- Kullanıcı adı
- XP barı
- Altın
- Çıkış ve sıfırlama butonları

Sol panel:

- Karakter geliştirmeleri
- Düşman test listesi

Orta alan:

- Savaş sahnesi
- Level yolu
- Karakter ve düşmanlar

Sağ panel:

- Durum
- Dükkan
- Birleştir
- Ekipman
- Ortak envanter

## Klasör Yapısı

```text
Game/
  assets/              Oyun görselleri, karakterler, düşmanlar, video
  assets/enemies/      Düşman sprite sheet dosyaları
  assets/items/        Item ikonları
  assets/materials/    Parçalama ve üretim malzemeleri
  data/users.json      Yerel kullanıcı ve karakter veritabanı
  src/game.js          Oyun mantığı ve arayüz davranışları
  index.html           Ana oyun arayüzü
  styles.css           Tüm stil dosyası
  server.js            Node server ve kayıt API'leri
  package.json         npm start komutu
```

## API Uçları

```text
POST /api/register
POST /api/login
POST /api/save
```

## Geliştirme Notları

- Kod vanilla JavaScript ile yazılmıştır.
- Dış npm paketi gerekmez.
- `npm install` zorunlu değildir.
- Veritabanı lokaldir; kayıtlar sadece bu bilgisayardaki proje klasöründe saklanır.
- Düşman sprite sheet'lerinde frame genişliği, frame yüksekliği, ground offset ve attack hızı düşman tanımında ayarlanır.
- İleride daha sağlam veri yapısı için SQLite veya PostgreSQL gibi bir veritabanına geçilebilir.

## Olası Sonraki Geliştirmeler

- Düşman test panelini ayrı debug moda taşıma
- Daha ayrıntılı loot tablosu
- Malzemelerle item yükseltme
- Boss seviyeleri
- Karakter sınıfları
- Daha gelişmiş dükkan yenileme sistemi
- Kalıcı ayarlar paneli
