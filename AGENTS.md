# Izdevumu uzskaite

## Mērķis
Vienas lapas tīmekļa lietotne personīgo izdevumu reģistrēšanai, filtrēšanai, atkārtošanai, eksportēšanai un mēneša kopsavilkuma aprēķinam pārlūkprogrammā bez servera daļas.

## Faili un atbildība
- `index.html` — semantiskā struktūra, ievades forma (ar atkārtošanas izvēlni), filtri, CSV eksporta poga, saraksts `#izdevumu-saraksts` un sadaļa "Mēneša kopsavilkums".
- `style.css` — lietotnes vizuālais noformējums, kopsavilkuma tabulas izkārtojums un adaptīvie stili.
- `app.js` — validācija, stāvoklis, atkārtoto izdevumu ģenerēšana, CSV eksports, mēneša kopsavilkuma aprēķins, DOM atjaunošana un `localStorage` sinhronizācija.

## Datu struktūra
Katrs ieraksts masīvā satur:
- `id` (`string`), `apraksts` (`string`), `summaCenti` (`number` > 0), `kategorija` (`string`), `datums` (`YYYY-MM-DD`).
- `atkartot` (`string`) — `"nav"`, `"nedela"` vai `"menesis"` (veciem ierakstiem noklusēti `"nav"`).
- `avotaId` (`string | null`) — avota ieraksta `id`, no kura ģenerēts ieraksts, vai `null`.

## Galvenās `app.js` funkcijas
- `ieladetIzdevumus()`, `saglabatIzdevumus(saraksts)` — nolasa, migrē, validē un saglabā JSON masīvu.
- `irDerigsIeraksts(ieraksts)`, `parsetSummuCentos(ievadeVirkne)` — ieraksta un summas validācija.
- `irDerigsKalendaraDatums(datumaVirkne)`, `iegutSodienasDatumu()` — datuma pārbaude un noklusējums.
- `aprekinatNakamoDatumu(datumaVirkne, atkartot)` — aprēķina +7 dienas vai nākamo mēnesi (pielāgojot mēneša pēdējai dienai).
- `vaiJauIrNakamaisIeraksts(avotaId)`, `izveidotNakamoIzdevumu(avotaId)` — pārbauda pēcteča esamību pēc `avotaId` un izveido nākamo ierakstu.
- `sakartotIzdevumus(saraksts)`, `formatetSummu(summaCenti)`, `formatetDatumu(datums)` — kārtošana un formatēšana.
- `eksportetCSV()`, `formatetSummuCsv(summaCenti)`, `ekranetCsvLauku(vertiba)` — eksportē visus izdevumus UTF-8 ar BOM CSV failā ar `;`.
- `iegutMenesaKopsavilkumaMenesus(saraksts)`, `atjaunotMenesaKopsavilkumu()` — atlasa unikālos `YYYY-MM` mēnešus dilstoši, grupē visus izvēlētā mēneša izdevumus pa kategorijām, aprēķina kopsummas centos un procentus, attēlo tabulā dilstoši.
- `izveidotIzdevumaElementu(ieraksts)`, `atjaunotSarakstu()` — saraksta, pogas "Izveidot nākamo", meklēšanas un kopsummas attēlošana.
- `paraditKludas(kludas)`, `notiritKludas()`, `dzestIzdevumu(id)`, `normalizetTekstu(teksts)` — kļūdas, dzēšana un diakritiku normalizācija.

## Noteikumi un palaišana
- **Glabāšana un kārtošana:** `localStorage` atslēga `"pd3-izdevumi"`; jaunākie datumi augšā.
- **Atkārtošana:** no viena avota neveido otru pēcteci, kamēr tas pastāv; dzēstu pēcteci drīkst izveidot atkārtoti.
- **CSV eksports:** 4 kolonnas (`Datums;Apraksts;Kategorija;Summa EUR`), faila nosaukums `izdevumi-YYYY-MM-DD.csv`.
- **Mēneša kopsavilkums:** izmanto visus saglabātos datus neatkarīgi no meklēšanas; sākumā izvēlas jaunāko `YYYY-MM` mēnesi; kārto pēc summas dilstoši.
- **Serveris:** `python -m http.server 8000` (vai VS Code Live Server)

## Noteikumi aģentam
- Izlasi šo failu un vispirms apraksti izmaiņu plānu.
- Pirms failu mainīšanas gaidi manu apstiprinājumu.
- Maini tikai index.html, style.css un app.js.
- Nepievieno bibliotēkas un neinstalē pakotnes.
- Nemaini datu struktūru un localStorage atslēgu. Summas glabā centos.
- Saglabā esošo funkcionalitāti. Nedzēs jau esošās funkcijas.
- Neveic Git fiksācijas un izmaiņu atcelšanu.
- Beigās uzskaiti mainītos failus, funkcijas un veiktās pārbaudes.