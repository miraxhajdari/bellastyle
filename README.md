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

Çmimet bazë të produkteve ruhen në denarë dhe shfaqen edhe në euro me kursin fiks 1 € = 61,5 ден. Çmimi në euro shfaqet pa qindarka: pjesa dhjetore deri në 0,50 ulet, ndërsa pjesa mbi 0,50 ngrihet në euron tjetër (p.sh. 20,50 € bëhet 20 € dhe 20,97 € bëhet 21 €). Për Maqedoninë e Veriut, klienti paguan në denarë dhe transporti kushton 160 ден. Për Kosovën, klienti paguan në euro (transporti 6 €); për Shqipërinë, klienti paguan në euro (transporti 8 €). Konvertimi në euro bëhet nga serveri dhe shuma për pagesë shfaqet në checkout para konfirmimit.

## Çfarë punon sot

- Katalog prove me 86 modele nga fleta `Products`, secili me fotografinë lokale, emër neutral modeli, çmimin 6000 ден dhe masat e shënuara aty. Për 14 rreshta pa çmim në tabelë u përdor çmimi 6000 ден sipas konfirmimit. Tre modele pa masa të vlefshme kërkojnë kontakt me dyqanin.
- Klienti zgjedh masën para se ta shtojë produktin në shportë; porosia dhe paneli admin e ruajnë masën e zgjedhur.
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
