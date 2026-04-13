export type JourneyMode = {
  key: 'cerrahi' | 'medikal';
  eyebrow: string;
  title: string;
  description: string;
  outcomes: string[];
  accent: [string, string];
  icon: string;
};

export type ProcedureEditorial = {
  mood: string;
  bestFor: string[];
  consultQuestions: string[];
  prepChecklist: string[];
  aftercare: string;
  clinicSignals: string[];
};

export const STUDIO_PILLARS = [
  {
    icon: 'document-text-outline',
    title: 'Danisma dosyasi',
    description: 'Her analiz, randevuya giderken kullanabilecegin sorular ve notlarla desteklenir.',
  },
  {
    icon: 'compass-outline',
    title: 'Karar pusulasi',
    description: 'Cerrahi ve medikal rotalar farkli iyilesme ve butce pencereleriyle birlikte gorulur.',
  },
  {
    icon: 'sparkles-outline',
    title: 'Stil ipuclari',
    description: 'Yalnizca islem onerisi degil; yuz sekline uygun stil ve gunluk bakım ipuclari da verilir.',
  },
];

export const JOURNEY_MODES: JourneyMode[] = [
  {
    key: 'cerrahi',
    eyebrow: 'Uzun vadeli rota',
    title: 'Cerrahi karar dosyasi',
    description: 'Randevu oncesi sorular, toparlanma penceresi ve maliyet araligi bir arada.',
    outcomes: ['Klinikte sorulacak sorular', 'Iyilesme penceresi', 'Maliyet kapsami'],
    accent: ['#46C6FF', '#6BE3C0'],
    icon: 'layers-outline',
  },
  {
    key: 'medikal',
    eyebrow: 'Hizli dokunuslar',
    title: 'Medikal bakım rotasi',
    description: 'Seans yogunlugu dusuk, takip ve rutin plani daha on planda bir akıs.',
    outcomes: ['Seans notlari', 'Bakım odaklari', 'Risk ve sure dengesi'],
    accent: ['#FF8C72', '#FFB078'],
    icon: 'color-wand-outline',
  },
];

export const PROCEDURE_EDITORIAL_MAP: Record<string, ProcedureEditorial> = {
  rinoplasti: {
    mood: 'Profil ve nefes dengesi',
    bestFor: ['Profil dengesini netlestirmek isteyenler', 'Fonksiyon ve gorunum kararini birlikte degerlendirenler'],
    consultQuestions: [
      'Kapali mi acik teknik mi oneriyorsunuz ve neden?',
      'Odeme azaltmak icin ne kadar sure bandaj veya atel kullanacagim?',
      'Simulasyon ile gercek sonuc arasindaki farki nasil anlatiyorsunuz?',
    ],
    prepChecklist: ['Sigara kullaniyorsan doktorunla birakma takvimi belirle', 'Burun ici sorunlarin varsa not al', 'Ilk 2 haftalik toplantilarini hafiflet'],
    aftercare: 'Ilk gunlerde sislik ve morluk normaldir; uyku pozisyonu ve soguk uygulama plani kritik olur.',
    clinicSignals: ['Profil fotograflari uzerinden plan anlatimi', 'Nefes fonksiyonu icin detayli muayene', 'Gercekci iyilesme takvimi'],
  },
  dudak_dolgusu: {
    mood: 'Hacim ve kontur dengesi',
    bestFor: ['Dogal hacim isteyenler', 'Once kucuk dozla ilerlemek isteyenler'],
    consultQuestions: [
      'Dolgu markasi ve hedef hacim nasil belirlenecek?',
      'Odem veya morluk olursa ilk 48 saat ne yapmaliyim?',
      'Dudak anatomime gore hangi bolgelere odaklanacaksiniz?',
    ],
    prepChecklist: ['Randevu oncesi kan sulandirici kullanimini doktoruna sor', 'Istegini anlatan 2 referans foto kaydet', 'Alerji gecmisini not et'],
    aftercare: 'Ilk 24 saatte baski ve sicak ortamdan kacınmak dudak formunu korumaya yardimci olur.',
    clinicSignals: ['Asimetrileri aynada anlatarak gostermeleri', 'Geri donus / top-up politikasini net anlatmalari', 'Minimal dozla baslama onerisi'],
  },
  botoks: {
    mood: 'Ifade yumusatma',
    bestFor: ['Mimik cizgilerini yumusatmak isteyenler', 'Kisa seans ve dusuk downtime arayanlar'],
    consultQuestions: [
      'Hangi kas gruplarina uygulama planliyorsunuz?',
      'Ifade kaybi olmadan dogal sonuc icin doz nasil ayarlaniyor?',
      'Kontrol randevusu kac gun sonra olmali?',
    ],
    prepChecklist: ['Randevu gunu yogun antrenman planlama', 'Gecmis botoks deneyimlerini not et', 'Mimiklerini rahatsiz eden bolgeleri aynada belirle'],
    aftercare: 'Ilk saatlerde egilmemek ve bolgeyi masajlamamak uygulamanin oturmasina yardim eder.',
    clinicSignals: ['Mimik analizi yapmalari', 'Doz planini bolge bazli aciklamalari', '2 hafta kontrol randevusu vermeleri'],
  },
  lazer_cilt: {
    mood: 'Doku ve leke yenileme',
    bestFor: ['Cilt dokusunu iyilestirmek isteyenler', 'Birden fazla seansa hazir olanlar'],
    consultQuestions: [
      'Hangi lazer tipi benim cilt tonum icin daha guvenli?',
      'Seans aralari ve gunes koruma rutini nasil olmali?',
      'Leke ve doku icin beklenti seviyesi nedir?',
    ],
    prepChecklist: ['Aktif retinol/asit kullanimini doktora bildir', 'Son gunes maruziyetini not et', 'Bakım urunlerinin listesini hazirla'],
    aftercare: 'Gunes koruma, nem bariyeri ve aktif iceriklere ara verme sureci sonucun ana parcasidir.',
    clinicSignals: ['Cilt tonu ve hassasiyet testi yapmalari', 'Seans sonrasi urun listesi vermeleri', 'Mevsime gore planlama onermeleri'],
  },
  elmacik_dolgusu: {
    mood: 'Yapı ve isik oyunu',
    bestFor: ['Yuze hafif yukseklik katmak isteyenler', 'Konturlu fakat sert olmayan sonuc arayanlar'],
    consultQuestions: [
      'Dolgu derinligi ve miktari nasil secilecek?',
      'Yandan profilde ne kadar degisim beklemeliyim?',
      'Asimetriyi azaltmak icin kademeli plan yapar misiniz?',
    ],
    prepChecklist: ['Yuze ait on ve profil fotolari sec', 'Yumusak mi belirgin mi istedigini not al', 'Odem durumunda sosyal planlarini ayarla'],
    aftercare: 'Ilk gunlerde dokunma ve yogun baskidan kacınmak dolguyu korumaya yardim eder.',
    clinicSignals: ['Yuzu farkli acilardan analiz etmeleri', 'Miktar yerine oran anlatmalari', 'Kontrol randevusu planlamalari'],
  },
  blefaroplasti: {
    mood: 'Dinlenmis bakis',
    bestFor: ['Ust veya alt kapakta sarkma hissedenler', 'Gorus alanini da iyilestirmek isteyenler'],
    consultQuestions: [
      'Ust kapak, alt kapak veya kombine plan mi oneriyorsunuz?',
      'Morarma ve sislik icin ortalama ne kadar sosyal ara gerekir?',
      'Iz yerlesimi ve iyilesme sureci nasil olur?',
    ],
    prepChecklist: ['Lens kullaniyorsan not et', 'Ilk hafta ekran ve toplanti planini hafiflet', 'Uyku pozisyonunu onceden hazirla'],
    aftercare: 'Goz cevresinde sislik normaldir; soguk uygulama ve yuksek yastik ilk haftayi rahatlatir.',
    clinicSignals: ['Fotograf uzerinden kapak anatomisini anlatmalari', 'Iz beklentisini acikca soylemeleri', 'Net bir kontrol takvimi sunmalari'],
  },
  mentoplasti: {
    mood: 'Alt yuz dengesi',
    bestFor: ['Profil dengesini guclendirmek isteyenler', 'Cene ucu destegine ihtiyac duyanlar'],
    consultQuestions: [
      'Implant mi, yag enjeksiyonu mu, kemik islemi mi daha uygun?',
      'Boyun ve jawline gorunumu birlikte degerlendiriliyor mu?',
      'Hangi durumlarda geri donus veya revizyon gerekir?',
    ],
    prepChecklist: ['Profil fotograflarini hazirla', 'Dis sikma veya cene aliskanliklarini not et', 'Ilk hafta yumusak gida planla'],
    aftercare: 'Ilk gunlerde konusma, sislik ve cene hareketlerinde hassasiyet olağandır; kontrollu toparlanma gerekir.',
    clinicSignals: ['Profil simulasyonu gostermeleri', 'Damak ve cene kapanisi hakkinda konusmalari', 'Revizyon politikasini netlestirmeleri'],
  },
};

export function getProcedureEditorial(
  id: string,
  category: 'cerrahi' | 'medikal',
  title: string
): ProcedureEditorial {
  return (
    PROCEDURE_EDITORIAL_MAP[id] || {
      mood: category === 'cerrahi' ? 'Karar ve iyilesme dengesi' : 'Bakım ve sure dengesi',
      bestFor: [
        `${title} surecine adim adim hazirlanmak isteyenler`,
        category === 'cerrahi' ? 'Toparlanma takvimini onceden planlayanlar' : 'Seans takibini netlestirmek isteyenler',
      ],
      consultQuestions: [
        `${title} icin beklentimi hangi acilardan gostermeliyim?`,
        'Risk ve toparlanma surecini kisilesmis olarak nasil anlatiyorsunuz?',
        'Takip randevulari nasil planlaniyor?',
      ],
      prepChecklist: ['Beklentini not al', 'Referans fotograflari sec', 'Gorusme oncesi sorularini tek sayfada topla'],
      aftercare: 'Karar vermeden once toparlanma, maliyet ve takip surecini netlestirmek en dogru adımdır.',
      clinicSignals: ['Acik iletişim', 'Kisisel planlama', 'Net kontrol takvimi'],
    }
  );
}
