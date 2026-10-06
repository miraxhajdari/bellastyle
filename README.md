# BellaStyle.mk

Dyqan online në shqip. Kodi përdor Node.js; lokalisht ruhen të dhënat në data.json, ndërsa në production në PostgreSQL.

## Nisja lokalisht

Kërkohet Node.js 18+. Hape Nis-BellaStyle.bat me dy klikime, ose nga PowerShell në këtë dosje:

```powershell
node server.js
```

Pastaj vizito http://localhost:3000. Fotot dhe fontet kërkojnë internet.

Llogaria lokale e administratorit krijohet një herë duke vendosur ADMIN_EMAIL dhe ADMIN_PASSWORD në PowerShell para nisjes. Përdor së paku 14 karaktere. Nëse admini është krijuar tashmë, hyr me emailin dhe fjalëkalimin ekzistues. Mos i dërgo fjalëkalimet në bisedë dhe mos i ruaj në GitHub.

## Dërgesat

Arka llogarit transportin nga serveri: Maqedonia e Veriut 160 ден; Kosova 6 €; Shqipëria 8 €. Produktet aktualisht kanë çmime në MKD. Për Kosovë/Shqipëri, shuma shfaqet si nëntotali në MKD plus tarifa në EUR derisa të caktohet një kurs konvertimi.

## Çfarë punon sot

- Regjistrimi/hyrja e klientëve dhe ruajtja e fjalëkalimit si hash scrypt.
- Porositë me pagesë në dorëzim, të dukshme për klientin e vet.
- Panel administratori për shikimin/ndryshimin e statusit të porosive dhe shtimin e produkteve.
- Roli admin krijohet veçmas; regjistrimi publik krijon vetëm llogari customer.
- Në PostgreSQL ruhen sesione me hash të tokenit, përdoruesit, produktet dhe porositë.
- Admini mund të ndryshojë fjalëkalimin; kjo mbyll sesionet e tjera. Mbrojtjet përfshijnë cookie HttpOnly/Secure në production, kontroll të origjinës, kufizim tentativash dhe CSP.

## Hostimi në Render

Blueprint-i render.yaml krijon shërbimin Node dhe një PostgreSQL të menaxhuar në Frankfurt. Databaza është e kufizuar te rrjeti privat i Render-it. Hostimi falas nuk është i përshtatshëm për porosi reale; databazat falas skadojnë pas 30 ditësh dhe shërbimet falas kanë kufizime.

1. Krijo llogari personale në GitHub dhe Render.
2. Krijo një depo private në GitHub dhe vendos aty projektin. Skedari .gitignore përjashton data.json dhe .env; mos e hiq.
3. Në Render zgjidh New → Blueprint, lidh depon dhe kontrollo burimet që krijohen para se t’i konfirmosh.
4. Zgjidh planet e paguara të përcaktuara në render.yaml. Vendos ADMIN_EMAIL (emaili i administratorit) dhe ADMIN_PASSWORD (fjalëkalim i ri, unik, të paktën 14 karaktere) si sekrete në Render. Mos përdor fjalëkalimin e llogarisë lokale dhe mos e vendos në depo.
5. Pasi të mbarojë deploy, përdor URL-në .onrender.com. Kontrollo hyrjen admin, regjistrimin e një klienti prove, vendosjen e porosisë, izolimin e saj nga klientët e tjerë dhe ndryshimin e statusit në panelin admin.
6. Ende nuk ke domen: faqja mund të funksionojë fillimisht në .onrender.com. Kur të blesh domen, shtoje te Settings → Custom Domains në Render dhe vendos DNS sipas vlerave që shfaq Render. TLS/HTTPS lëshohet automatikisht.
7. Para marrjes së porosive reale, zëvendëso katalogun demonstrues me foto, çmime, madhësi/ngjyra, stok dhe politika reale të dërgesës/kthimit.

Planet e përcaktuara në `render.yaml` janë me pagesë. Kontrolloji çmimet aktuale të Render-it para aktivizimit; domeni dhe trafiku mund të shtojnë kosto.

## Kufijtë para lançimit

Ky projekt nuk ka ende pagesë me kartë, verifikim emaili, rikuperim fjalëkalimi, email/SMS porosie, inventar sipas madhësisë/ngjyrës, ose politikë privatësie/kthimi. Këto duhen vendosur para se klientët realë të bëjnë porosi. Të dhënat që mbledhen për porosi (emri, emaili, telefoni, adresa) janë të dhëna personale. Për publikim, përgatit njoftimin e privatësisë, qëllimin dhe afatin e ruajtjes së tyre, kufizo qasjen te personat e autorizuar dhe kontrollo detyrimet sipas Ligjit për Mbrojtjen e të Dhënave Personale në Maqedoninë e Veriut me këshilltar lokal.

Asnjë konfigurim nuk garanton siguri absolute. Para se ta shpallësh live, duhen kontrolluar mjedisi real, llogaria admin, DNS, databaza/backup-et, politikat dhe procesi i porosisë.
