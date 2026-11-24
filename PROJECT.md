# Izdevumu uzskaite

## Mērķis
Vienas lapas tīmekļa lietotne personīgo izdevumu reģistrēšanai, filtrēšanai un kopsummas aprēķinam pārlūkprogrammā bez bibliotēkām un servera daļas.

## Faili un atbildība
- `index.html` — semantiskā struktūra, ievades forma, kategoriju filtri un saraksts `#izdevumu-saraksts`.
- `style.css` — lietotnes vizuālais noformējums, izkārtojums un adaptīvie stili.
- `app.js` — ievades validācija, stāvokļa pārvaldība, DOM atjaunošana un `localStorage` sinhronizācija.

## Datu struktūra
Katrs ieraksts masīvā satur:
- `id` (`string`) — unikāls identifikators.
- `apraksts` (`string`) — apgriezts (`trim`) apraksts, attēlots kā teksts.
- `summaCenti` (`number`) — pozitīvs vesels skaitlis centos.
- `kategorija` (`string`) — `Pārtika`, `Transports`, `Mājoklis`, `Izklaide`, `Veselība` vai `Cits`.
- `datums` (`string`) — kalendāra datums formātā `YYYY-MM-DD`.

## Galvenās `app.js` funkcijas
- `ieladetIzdevumus()`, `saglabatIzdevumus(saraksts)` — nolasa, validē un saglabā JSON masīvu.
- `parsetSummuCentos(ievadeVirkne)` — validē summu un pārvērš to veselos centos.
- `irDerigsKalendaraDatums(datumaVirkne)`, `iegutSodienasDatumu()` — kalendāra datuma pārbaude un noklusējums.
- `sakartotIzdevumus(saraksts)` — kārtošana pēc datuma un pievienošanas secības.
- `formatetSummu(summaCenti)`, `formatetDatumu(datums)` — datu formatēšana attēlošanai.
- `izveidotIzdevumaElementu(ieraksts)`, `atjaunotSarakstu()` — saraksta, kopsummas un tukšā stāvokļa attēlošana.
- `paraditKludas(kludas)`, `notiritKludas()`, `dzestIzdevumu(id)` — kļūdu paziņojumi un ierakstu dzēšana.
- `normalizetTekstu(teksts)` - meklēšana pēc apraksta ignorē burtu reģistru un diakritiskās zīmes.

## Noteikumi
- **Centi:** summu glabā veselos centos (`summaCenti > 0`, līdz 2 decimālzīmēm) un attēlo formātā `"12,50 €"`.
- **Datuma formāts:** `YYYY-MM-DD` kalendāra datums bez laika joslas pārveidošanas.
- **Glabāšana:** JSON masīvs `localStorage` atslēgā `"pd3-izdevumi"`.
- **Saraksta secība:** jaunākie datumi augšā; vienādu datumu gadījumā jaunākie pievienotie ieraksti augšā.

## Palaišana ar statisko serveri
Projekta mapē palaidiet lokālo statisko HTTP serveri:
```bash
python3 -m http.server 8000
```