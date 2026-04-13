# Yüz Atölyem - Kişisel Güzellik Asistanı

## Uygulama Tanımı
Yüz Atölyem, yapay zeka destekli kişisel güzellik asistanıdır. Yüz analizi, cilt günlüğü takibi, bakım rutini yönetimi ve estetik prosedür rehberi özellikleriyle kullanıcılara kapsamlı bir güzellik deneyimi sunar.

## Teknik Yığın
- **Frontend:** React Native + Expo SDK 54 + TypeScript
- **Backend:** FastAPI + MongoDB + Motor
- **AI:** OpenAI GPT-4o Vision + DALL-E 3
- **IAP:** RevenueCat (iOS)
- **Auth:** JWT + Google OAuth (Emergent)
- **Deploy:** Railway

## Temel Özellikler

### 1. AI Yüz Analizi
- Cerrahi ve medikal estetik kategorileri
- 10+ yüz metriği ölçümü (simetri, çene hattı, burun oranı vb.)
- Yüz şekli tespiti ve kişisel ipuçları
- Türk Lirası cinsinden fiyat rehberi
- AI dönüşüm simülasyonu (Premium)

### 2. Cilt Günlüğü (Yeni)
- Günlük cilt durumu takibi (mood seçimi)
- Bakım rutini checklist (temizleyici, tonik, serum, nemlendirici, güneş kremi, maske)
- Su tüketimi sayacı
- Uyku süresi takibi
- Giriş geçmişi ve istatistikler
- Streak (seri) takibi

### 3. Prosedür Rehberi
- Cerrahi ve medikal estetik prosedür kataloğu
- Türk Lirası cinsinden fiyat aralıkları
- Süre, iyileşme süresi ve risk seviyesi bilgileri
- Popülerlik oranları ve faydalar

### 4. Günlük İpuçları
- Su tüketimi, güneş koruması, uyku, beslenme kategorilerinde ipuçları
- Ana ekranda günün ipucu kartı

## Tasarım Sistemi
- **Tema:** Koyu teal/zümrüt tonları + mercan aksanları
- **Ana Renkler:** #050D0F (bg), #2DD4A8 (brand), #F7856E (accent)
- **Tipografi:** Ağırlık 800 başlıklar, sıkı letter-spacing
- **Görseller:** Altıgen grid deseni, yüzen orblar, gradient tarama çizgileri

## Ekranlar
1. Splash (altıgen grid + yüzen orblar)
2. Onboarding (3 sayfa, animasyonlu)
3. Auth (giriş/kayıt + Google)
4. Ana Sayfa (günün ipucu + AI analiz hero + kategori seçimi + hızlı erişim)
5. Keşfet (prosedür kataloğu + filtreler)
6. Cilt Günlüğü (mood + rutin + su + uyku + geçmiş)
7. Geçmiş (analiz listesi + skor)
8. Profil (kullanıcı bilgileri + premium + ayarlar)
9. Kamera (fotoğraf çek/seç)
10. Analiz Yükleme (adım göstergesi + ilerleme)
11. Sonuçlar (skor + yüz şekli + metrikler + öneriler + dönüşüm)
12. Günlük Not Ekleme

## Monetizasyon
- Freemium model
- Ücretsiz: 1 analiz, ilk öneri, günlük günlük, prosedür rehberi
- Premium: Sınırsız analiz, tüm öneriler, AI dönüşüm simülasyonu
- 7 gün ücretsiz deneme + aylık ₺599
