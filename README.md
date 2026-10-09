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

- Katalogu ka 96 modele me emra neutralë (`Modeli 01` e tutje), fotografitë e integruara në Excel, çmimet reale të shitjes në denarë dhe masat e disponueshme. Sheet-i `Products for Project` përsërit listën disa herë; katalogu përdor një herë secilin nga 96 produktet. Tri produkteve pa masë të shënuar nuk u lejohet porosia derisa masa të plotësohet.
- Klienti zgjedh masën para se ta shtojë produktin në shportë; porosia dhe paneli admin e ruajnë masën e zgjedhur.
- Çdo masë e listuar trajtohet si një copë unike: kur porosia pranohet, masa hiqet nga disponueshmëria. Baza PostgreSQL e bën heqjen dhe ruajtjen e porosisë në një transaksion, që dy klientë të mos porosisin të njëjtën masë njëkohësisht.
- Kur admini anulon një porosi të re ose të konfirmuar, masat e saj kthehen në disponueshmëri. Anulimi pas dorëzimit te kargoja nuk e kthen automatikisht stokun; artikulli duhet të jetë kthyer fizikisht para se të rikthehet në katalog.
- Regjistrimi/hyrja e klientëve dhe ruajtja e fjalëkalimit si hash scrypt.
- Porositë me pagesë në dorëzim, të dukshme për klientin e vet.
- Panel administratori për shikimin/ndryshimin e statusit të porosive dhe shtimin e produkteve.
- Roli admin krijohet veçmas; regjistrimi publik krijon vetëm llogari customer.
- Në PostgreSQL ruhen sesione me hash të tokenit, përdoruesit, produktet dhe porositë.
- Paneli admin kërkon verifikim me dy hapa (TOTP) pas aktivizimit; kodet e rikuperimit shfaqen vetëm një herë. Sekreti MFA ruhet i enkriptuar me AES-256-GCM. Mbrojtjet përfshijnë cookie HttpOnly/Secure në production, kontroll të origjinës, kufizim tentativash dhe CSP.

## Hostimi në Render

Blueprint-i render.yaml krijon shërbimin Node dhe një PostgreSQL të menaxhuar në Frankfurt. Databaza është e kufizuar te rrjeti privat i Render-it. Hostimi falas nuk është i përshtatshëm për porosi reale; databazat falas skadojnë pas 30 ditësh dhe shërbimet falas kanë kufizime.

1. Krijo llogari personale në GitHub dhe Render.
2. Krijo një depo private në GitHub dhe vendos aty projektin. Skedari .gitignore përjashton data.json dhe .env; mos e hiq.
3. Në Render zgjidh New → Blueprint, lidh depon dhe kontrollo burimet që krijohen para se t’i konfirmosh.
4. Zgjidh planet e përcaktuara në render.yaml. Vendos ADMIN_EMAIL (emaili i administratorit) dhe ADMIN_PASSWORD (fjalëkalim i ri, unik, të paktën 14 karaktere) si sekrete në Render. Render gjeneron vetë MFA_ENCRYPTION_KEY gjatë krijimit të shërbimit. Mos përdor fjalëkalimin e llogarisë lokale dhe mos vendos sekrete në depo.
5. Pasi të mbarojë deploy, hyr si admin, aktivizo MFA me Google Authenticator ose Microsoft Authenticator dhe ruaji kodet e rikuperimit jashtë kompjuterit. Pastaj kontrollo hyrjen përsëri me fjalëkalim + kod, regjistrimin e klientit provë, porosinë, izolimin e saj nga klientët e tjerë dhe ndryshimin e statusit.
6. Ende nuk ke domen: faqja mund të funksionojë fillimisht në .onrender.com. Kur të blesh domen, shtoje te Settings → Custom Domains në Render dhe vendos DNS sipas vlerave që shfaq Render. TLS/HTTPS lëshohet automatikisht.
7. Para marrjes së porosive reale, krahaso katalogun e importuar me Excel-in, plotëso tri masat që mungojnë dhe publiko kontaktin, privatësinë, dërgesën dhe kthimin.

### Backup-et e databazës

Databaza në `render.yaml` përdor planin me pagesë. Render ofron backup të vazhdueshëm dhe rikthim në kohë (PITR); periudha e rikthimit varet nga plani i workspace-it (3 ditë në Hobby, 7 ditë në Pro e më lart, sipas dokumentacionit aktual). Para porosive reale, hape databazën në Render → Recovery, kontrollo që pikat e rikthimit shfaqen dhe krijo një eksport manual. Shkarko eksportet periodikisht dhe ruaji të enkriptuara jashtë Render-it, me qasje vetëm për pronarin. Eksporti manual në Render mbahet 7 ditë; për ruajtje afatgjatë automatizo `pg_dump` në një hapësirë private si S3. Bëj një rikthim prove para se të mbështetesh te backup-i.

### Emaili i klientit dhe njoftimet

Verifikimi i emailit të klientit nuk kërkohet: klienti regjistrohet dhe mund të porosisë me pagesë në dorëzim. Emaili përdoret si identifikues i llogarisë. Njoftimet me email për porosinë janë opsionale; pa `RESEND_API_KEY` dhe `EMAIL_FROM`, porositë prapë ruhen në databazë dhe shfaqen në panelin admin. Nëse më vonë dëshiron njoftime, konfiguro Resend dhe një domen dërgues të verifikuar pasi të blesh domenin e dyqanit.

Planet e përcaktuara në `render.yaml` janë me pagesë. Kontrolloji çmimet aktuale të Render-it para aktivizimit; domeni dhe trafiku mund të shtojnë kosto.

## Kufijtë para lançimit

Para lançimit duhet konfirmuar disponueshmëria reale dhe të publikohen politikat e privatësisë, dërgesës dhe kthimit. Të dhënat që mbledhen për porosi (emri, emaili, telefoni, adresa) janë të dhëna personale. Përcakto qëllimin dhe afatin e ruajtjes së tyre, kufizo qasjen te personat e autorizuar dhe kontrollo detyrimet sipas Ligjit për Mbrojtjen e të Dhënave Personale në Maqedoninë e Veriut me këshilltar lokal. Emaili i verifikimit dhe njoftimet email nuk janë kusht për funksionimin e porosive me pagesë në dorëzim.

Asnjë konfigurim nuk garanton siguri absolute. Para se ta shpallësh live, duhen kontrolluar mjedisi real, llogaria admin, DNS, databaza/backup-et, politikat dhe procesi i porosisë.

## Siguria MFA e administratorit

- Pas hyrjes së parë admin, hap panelin “Porositë” dhe zgjidh “Aktivizo MFA”. MFA duhet të konfigurohet para se API-ja e adminit të lejojë menaxhimin e porosive/produkteve.
- Përdor Google Authenticator ose Microsoft Authenticator. Vendose çelësin sekret manualisht dhe konfirmo kodin 6-shifror.
- Ruaji dhjetë kodet e rikuperimit një herë të shfaqura në një menaxher fjalëkalimesh ose vend të sigurt jashtë këtij kompjuteri. Secili përdoret vetëm një herë.
- `MFA_ENCRYPTION_KEY` duhet të jetë çelës i qëndrueshëm, Base64 i 32 bajteve të rastësishme. Në Render ruaje te Environment si secret. Për konfigurim lokal një herë në PowerShell, përdor:

```powershell
$bellaMfaKey = [Environment]::GetEnvironmentVariable('MFA_ENCRYPTION_KEY', 'User')
if (-not $bellaMfaKey) {
  $bellaMfaBytes = New-Object byte[] 32
  $bellaMfaRng = [Security.Cryptography.RandomNumberGenerator]::Create()
  $bellaMfaRng.GetBytes($bellaMfaBytes)
  $bellaMfaKey = [Convert]::ToBase64String($bellaMfaBytes)
  [Environment]::SetEnvironmentVariable('MFA_ENCRYPTION_KEY', $bellaMfaKey, 'User')
}
$env:MFA_ENCRYPTION_KEY = $bellaMfaKey
Remove-Variable bellaMfaKey, bellaMfaBytes, bellaMfaRng -ErrorAction SilentlyContinue
```

Nise serverin në të njëjtën dritare PowerShell. Mos e gjenero përsëri pasi MFA të aktivizohet dhe mos e dërgo në chat/GitHub.
- Nëse humbet telefonin, përdor një kod rikuperimi në hyrje. Nëse humben edhe të gjitha kodet, rikuperimi kërkon qasje administrative në databazë.

