const GLABATUVES_ATSLEGA = "pd3-izdevumi";
const ATLAUTAS_KATEGORIJAS = [
  "Pārtika",
  "Transports",
  "Mājoklis",
  "Izklaide",
  "Veselība",
  "Cits",
];
const ATLAUTIE_ATKARTOJUMI = ["nav", "nedela", "menesis"];
const ATKARTOJUMA_NOSAUKUMI = {
  nedela: "Katru nedēļu",
  menesis: "Katru mēnesi",
};

const forma = document.getElementById("izdevumu-forma");
const aprakstaIevade = document.getElementById("apraksts");
const summasIevade = document.getElementById("summa");
const kategorijasIevade = document.getElementById("kategorija");
const datumaIevade = document.getElementById("datums");
const kludasBloks = document.getElementById("kludas-pazinojums");
const sarakstsEl = document.getElementById("izdevumu-saraksts");
const tuksaisPazinojumsEl = document.getElementById("tukss-pazinojums");
const kopsummaEl = document.getElementById("kopsumma-vertiba");
const ierakstuSkaitsEl = document.getElementById("ierakstu-skaits");
const filtraPogas = Array.from(document.querySelectorAll(".filtra-poga"));
const meklesanasIevade = document.getElementById("meklesana");
const atkartotIevade = document.getElementById("atkartot");
const eksportetCsvPoga = document.getElementById("eksportet-csv");
const menesaIzvele = document.getElementById("menesa-izvele");
const menesaTabula = document.getElementById("menesa-kopsavilkuma-tabula");
const menesaTabulasRindas = document.getElementById("menesa-kopsavilkuma-rindas");
const menesaTukssPazinojums = document.getElementById("menesa-kopsavilkuma-tukss");

let aktivaKategorija = "Visi";
let meklesanasVaicajums = "";
let izdevumi = ieladetIzdevumus();
let izveletaisMenesis = "";

function iegutSodienasDatumu() {
  const tagad = new Date();
  const gads = String(tagad.getFullYear());
  const menesis = String(tagad.getMonth() + 1).padStart(2, "0");
  const diena = String(tagad.getDate()).padStart(2, "0");
  return `${gads}-${menesis}-${diena}`;
}

function irDerigsKalendaraDatums(datumaVirkne) {
  if (typeof datumaVirkne !== "string") {
    return false;
  }

  const sakritiba = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datumaVirkne);
  if (!sakritiba) {
    return false;
  }

  const gads = Number(sakritiba[1]);
  const menesis = Number(sakritiba[2]);
  const diena = Number(sakritiba[3]);
  const parbaude = new Date(gads, menesis - 1, diena);

  return (
    parbaude.getFullYear() === gads &&
    parbaude.getMonth() === menesis - 1 &&
    parbaude.getDate() === diena
  );
}

function parsetSummuCentos(ievadeVirkne) {
  const tirita = ievadeVirkne.trim();

  if (tirita.length === 0) {
    return { derigs: false, kluda: "Lūdzu, ievadiet summu EUR." };
  }

  if (tirita.startsWith("-")) {
    return { derigs: false, kluda: "Summai jābūt lielākai par 0." };
  }

  const formataSakritiba = /^(?:(\d+)(?:[.,](\d*))?|[.,](\d+))$/.exec(tirita);
  if (!formataSakritiba) {
    return {
      derigs: false,
      kluda: "Summa jānorāda kā pozitīvs skaitlis (piemēram, 12,50).",
    };
  }

  const veselaDala = formataSakritiba[1] ?? "0";
  const komataDala = formataSakritiba[2] ?? formataSakritiba[3] ?? "";

  if ((tirita.includes(".") || tirita.includes(",")) && komataDala.length === 0) {
    return {
      derigs: false,
      kluda: "Pabeidziet summas ievadi aiz komata vai noņemiet komatu.",
    };
  }

  if (komataDala.length > 2) {
    return {
      derigs: false,
      kluda: "Summai drīkst būt ne vairāk kā 2 zīmes aiz komata.",
    };
  }

  const veselie = Number.parseInt(veselaDala, 10);
  const centi = Number.parseInt(komataDala.padEnd(2, "0"), 10);
  const summaCenti = veselie * 100 + centi;

  if (!Number.isSafeInteger(summaCenti)) {
    return { derigs: false, kluda: "Ievadītā summa ir pārāk liela." };
  }

  if (summaCenti <= 0) {
    return { derigs: false, kluda: "Summai jābūt lielākai par 0." };
  }

  return { derigs: true, summaCenti };
}

function formatetSummu(summaCenti) {
  const eiro = Math.floor(summaCenti / 100);
  const centi = String(summaCenti % 100).padStart(2, "0");
  return `${eiro},${centi} €`;
}

function formatetDatumu(datums) {
  const [gads, menesis, diena] = datums.split("-");
  return `${diena}.${menesis}.${gads}`;
}

function iegutMenesaKopsavilkumaMenesus(saraksts) {
  const menesi = new Set();
  for (const ieraksts of saraksts) {
    menesi.add(ieraksts.datums.slice(0, 7));
  }
  return Array.from(menesi).sort((a, b) => b.localeCompare(a));
}

function atjaunotMenesaKopsavilkumu() {
  const pieejamieMenesi = iegutMenesaKopsavilkumaMenesus(izdevumi);

  if (
    izveletaisMenesis &&
    !pieejamieMenesi.includes(izveletaisMenesis)
  ) {
    izveletaisMenesis = "";
  }

  if (!izveletaisMenesis && pieejamieMenesi.length > 0) {
    izveletaisMenesis = pieejamieMenesi[0];
  }

  menesaIzvele.replaceChildren();
  for (const menesis of pieejamieMenesi) {
    const opcija = document.createElement("option");
    opcija.value = menesis;
    opcija.textContent = menesis;
    menesaIzvele.appendChild(opcija);
  }

  menesaIzvele.value = izveletaisMenesis;

  if (pieejamieMenesi.length === 0) {
    menesaIzvele.disabled = true;
    menesaTabula.hidden = true;
    menesaTukssPazinojums.hidden = false;
    menesaTabulasRindas.replaceChildren();
    return;
  }

  menesaIzvele.disabled = false;
  menesaTabula.hidden = false;
  menesaTukssPazinojums.hidden = true;

  const kopsavilkums = new Map();
  let menesaKopsummaCenti = 0;

  for (const ieraksts of izdevumi) {
    if (ieraksts.datums.slice(0, 7) !== izveletaisMenesis) {
      continue;
    }

    menesaKopsummaCenti += ieraksts.summaCenti;
    const esošais = kopsavilkums.get(ieraksts.kategorija) ?? {
      kategorija: ieraksts.kategorija,
      skaits: 0,
      summaCenti: 0,
    };
    esošais.skaits += 1;
    esošais.summaCenti += ieraksts.summaCenti;
    kopsavilkums.set(ieraksts.kategorija, esošais);
  }

  const rindas = Array.from(kopsavilkums.values()).sort(
    (a, b) => b.summaCenti - a.summaCenti
  );

  menesaTabulasRindas.replaceChildren();
  for (const rinda of rindas) {
    const tr = document.createElement("tr");

    const kategorijaTd = document.createElement("td");
    kategorijaTd.textContent = rinda.kategorija;

    const skaitsTd = document.createElement("td");
    skaitsTd.textContent = String(rinda.skaits);

    const summaTd = document.createElement("td");
    summaTd.textContent = formatetSummu(rinda.summaCenti);

    const dalaTd = document.createElement("td");
    const procents =
      menesaKopsummaCenti > 0
        ? Math.round((rinda.summaCenti / menesaKopsummaCenti) * 100)
        : 0;
    dalaTd.textContent = `${procents} %`;

    tr.append(kategorijaTd, skaitsTd, summaTd, dalaTd);
    menesaTabulasRindas.appendChild(tr);
  }
}

function formatetSummuCsv(summaCenti) {
  const eiro = Math.floor(summaCenti / 100);
  const centi = String(summaCenti % 100).padStart(2, "0");
  return `${eiro},${centi}`;
}

function ekranetCsvLauku(vertiba) {
  const teksts = String(vertiba ?? "");
  if (/[;"\r\n]/.test(teksts)) {
    return `"${teksts.replace(/"/g, '""')}"`;
  }
  return teksts;
}

function eksportetCSV() {
  const galvene = ["Datums", "Apraksts", "Kategorija", "Summa EUR"].join(";");

  // Eksportē visus saglabātos izdevumus (masīvu `izdevumi`), ignorējot filtrus un meklēšanu
  const rindas = izdevumi.map((ieraksts) => {
    const datums = formatetDatumu(ieraksts.datums); // DD.MM.YYYY
    const apraksts = ekranetCsvLauku(ieraksts.apraksts);
    const kategorija = ekranetCsvLauku(ieraksts.kategorija);
    const summa = formatetSummuCsv(ieraksts.summaCenti); // Piemēram, 3,50

    return [datums, apraksts, kategorija, summa].join(";");
  });

  const csvSaturs = [galvene, ...rindas].join("\r\n");
  const bom = "\uFEFF";
  const blob = new Blob([bom, csvSaturs], {
    type: "text/csv;charset=utf-8;",
  });

  const saite = document.createElement("a");
  const url = URL.createObjectURL(blob);
  saite.href = url;
  saite.download = `izdevumi-${iegutSodienasDatumu()}.csv`;

  document.body.appendChild(saite);
  saite.click();
  document.body.removeChild(saite);
  URL.revokeObjectURL(url);
}

function normalizetTekstu(teksts) {
  return teksts
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function generetUnikaluId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `izd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function aprekinatNakamoDatumu(datumaVirkne, atkartot) {
  const [gadsStr, menesisStr, dienaStr] = datumaVirkne.split("-");
  const gads = Number(gadsStr);
  const menesis = Number(menesisStr);
  const diena = Number(dienaStr);

  if (atkartot === "nedela") {
    const nakamais = new Date(gads, menesis - 1, diena + 7);
    const jaunaisGads = String(nakamais.getFullYear());
    const jaunaisMenesis = String(nakamais.getMonth() + 1).padStart(2, "0");
    const jaunaDiena = String(nakamais.getDate()).padStart(2, "0");
    return `${jaunaisGads}-${jaunaisMenesis}-${jaunaDiena}`;
  }

  if (atkartot === "menesis") {
    const merkaGads = menesis === 12 ? gads + 1 : gads;
    const merkaMenesis = menesis === 12 ? 1 : menesis + 1;
    const pedejaDienaMerkaMenesi = new Date(merkaGads, merkaMenesis, 0).getDate();
    const jaunaDiena = Math.min(diena, pedejaDienaMerkaMenesi);

    return `${String(merkaGads)}-${String(merkaMenesis).padStart(2, "0")}-${String(jaunaDiena).padStart(2, "0")}`;
  }

  return datumaVirkne;
}

function vaiJauIrNakamaisIeraksts(avotaId) {
  return izdevumi.some((ieraksts) => ieraksts.avotaId === avotaId);
}

function izveidotNakamoIzdevumu(avotaId) {
  notiritKludas();

  const avotaIeraksts = izdevumi.find((ieraksts) => ieraksts.id === avotaId);
  if (!avotaIeraksts || avotaIeraksts.atkartot === "nav") {
    return;
  }

  if (vaiJauIrNakamaisIeraksts(avotaId)) {
    return;
  }

  const nakamaisDatums = aprekinatNakamoDatumu(
    avotaIeraksts.datums,
    avotaIeraksts.atkartot
  );

  const nakamaisIeraksts = {
    id: generetUnikaluId(),
    apraksts: avotaIeraksts.apraksts,
    summaCenti: avotaIeraksts.summaCenti,
    kategorija: avotaIeraksts.kategorija,
    datums: nakamaisDatums,
    atkartot: avotaIeraksts.atkartot,
    avotaId: avotaIeraksts.id,
  };

  const atjaunotie = sakartotIzdevumus([nakamaisIeraksts, ...izdevumi]);
  const saglabats = saglabatIzdevumus(atjaunotie);

  if (!saglabats) {
    paraditKludas([
      {
        lauks: null,
        teksts: "Neizdevās saglabāt nākamo izdevumu pārlūkprogrammas krātuvē.",
      },
    ]);
    return;
  }

  izdevumi = atjaunotie;
  atjaunotSarakstu();
  atjaunotMenesaKopsavilkumu();
}

function irDerigsIeraksts(ieraksts) {
  if (
    !ieraksts ||
    typeof ieraksts !== "object" ||
    typeof ieraksts.id !== "string" ||
    ieraksts.id.trim().length === 0 ||
    typeof ieraksts.apraksts !== "string" ||
    ieraksts.apraksts.trim().length === 0 ||
    !Number.isInteger(ieraksts.summaCenti) ||
    ieraksts.summaCenti <= 0 ||
    !ATLAUTAS_KATEGORIJAS.includes(ieraksts.kategorija) ||
    !irDerigsKalendaraDatums(ieraksts.datums)
  ) {
    return false;
  }

  if (
    ieraksts.atkartot !== undefined &&
    !ATLAUTIE_ATKARTOJUMI.includes(ieraksts.atkartot)
  ) {
    return false;
  }

  if (
    ieraksts.avotaId !== undefined &&
    ieraksts.avotaId !== null &&
    (typeof ieraksts.avotaId !== "string" || ieraksts.avotaId.trim().length === 0)
  ) {
    return false;
  }

  return true;
}

function sakartotIzdevumus(saraksts) {
  return [...saraksts].sort((a, b) => b.datums.localeCompare(a.datums));
}

function ieladetIzdevumus() {
  try {
    const neapstradats = localStorage.getItem(GLABATUVES_ATSLEGA);
    if (!neapstradats) {
      return [];
    }

    const parsots = JSON.parse(neapstradats);
    if (!Array.isArray(parsots)) {
      return [];
    }

    const derigie = parsots
      .filter(irDerigsIeraksts)
      .map((ieraksts) => ({
        id: ieraksts.id,
        apraksts: ieraksts.apraksts.trim(),
        summaCenti: ieraksts.summaCenti,
        kategorija: ieraksts.kategorija,
        datums: ieraksts.datums,
        atkartot: ieraksts.atkartot ?? "nav",
        avotaId: ieraksts.avotaId ?? null,
      }));

    return sakartotIzdevumus(derigie);
  } catch {
    return [];
  }
}

function saglabatIzdevumus(saraksts) {
  try {
    localStorage.setItem(GLABATUVES_ATSLEGA, JSON.stringify(saraksts));
    return true;
  } catch {
    return false;
  }
}

function notiritKludas() {
  kludasBloks.hidden = true;
  kludasBloks.replaceChildren();
  aprakstaIevade.classList.remove("kludains");
  summasIevade.classList.remove("kludains");
  kategorijasIevade.classList.remove("kludains");
  datumaIevade.classList.remove("kludains");
  atkartotIevade.classList.remove("kludains");
}

function paraditKludas(kludas) {
  notiritKludas();

  if (kludas.length === 0) {
    return;
  }

  for (const kluda of kludas) {
    if (kluda.lauks) {
      kluda.lauks.classList.add("kludains");
    }
  }

  if (kludas.length === 1) {
    kludasBloks.textContent = kludas[0].teksts;
  } else {
    const saraksts = document.createElement("ul");
    for (const kluda of kludas) {
      const elements = document.createElement("li");
      elements.textContent = kluda.teksts;
      saraksts.appendChild(elements);
    }
    kludasBloks.appendChild(saraksts);
  }

  kludasBloks.hidden = false;
  if (kludas[0].lauks) {
    kludas[0].lauks.focus();
  }
}

function izveidotIzdevumaElementu(ieraksts) {
  const li = document.createElement("li");
  li.className = "izdevuma-ieraksts";
  li.dataset.id = ieraksts.id;

  const info = document.createElement("div");
  info.className = "izdevuma-info";

  const aprakstsEl = document.createElement("span");
  aprakstsEl.className = "izdevuma-apraksts";
  aprakstsEl.textContent = ieraksts.apraksts;

  const metadati = document.createElement("div");
  metadati.className = "izdevuma-metadati";

  const kategorijaEl = document.createElement("span");
  kategorijaEl.textContent = ieraksts.kategorija;

  const atdalitajs = document.createElement("span");
  atdalitajs.setAttribute("aria-hidden", "true");
  atdalitajs.textContent = "·";

  const datumsEl = document.createElement("time");
  datumsEl.className = "izdevuma-datums";
  datumsEl.setAttribute("datetime", ieraksts.datums);
  datumsEl.textContent = formatetDatumu(ieraksts.datums);

  metadati.append(kategorijaEl, atdalitajs, datumsEl);

  if (ieraksts.atkartot !== "nav") {
    const atkartotAtdalitajs = document.createElement("span");
    atkartotAtdalitajs.setAttribute("aria-hidden", "true");
    atkartotAtdalitajs.textContent = "·";

    const atkartotEl = document.createElement("span");
    atkartotEl.className = "izdevuma-atkartot";
    atkartotEl.textContent = ATKARTOJUMA_NOSAUKUMI[ieraksts.atkartot] || "";

    metadati.append(atkartotAtdalitajs, atkartotEl);
  }

  info.append(aprakstsEl, metadati);

  const labaisBloks = document.createElement("div");
  labaisBloks.className = "izdevuma-labais";

  const summaEl = document.createElement("span");
  summaEl.className = "izdevuma-summa";
  summaEl.textContent = formatetSummu(ieraksts.summaCenti);

  labaisBloks.append(summaEl);

  if (ieraksts.atkartot !== "nav") {
    const nakamaisPoga = document.createElement("button");
    nakamaisPoga.type = "button";
    nakamaisPoga.className = "poga-nakamais";
    nakamaisPoga.textContent = "Izveidot nākamo";

    const jauIzveidots = vaiJauIrNakamaisIeraksts(ieraksts.id);
    nakamaisPoga.disabled = jauIzveidots;
    nakamaisPoga.setAttribute(
      "aria-label",
      jauIzveidots
        ? `Nākamais izdevums jau ir izveidots: ${ieraksts.apraksts}`
        : `Izveidot nākamo izdevumu: ${ieraksts.apraksts}`
    );

    nakamaisPoga.addEventListener("click", () => {
      izveidotNakamoIzdevumu(ieraksts.id);
    });

    labaisBloks.append(nakamaisPoga);
  }

  const dzestPoga = document.createElement("button");
  dzestPoga.type = "button";
  dzestPoga.className = "poga-dzest";
  dzestPoga.textContent = "Dzēst";
  dzestPoga.setAttribute("aria-label", `Dzēst izdevumu: ${ieraksts.apraksts}`);
  dzestPoga.addEventListener("click", () => {
    dzestIzdevumu(ieraksts.id);
  });

  labaisBloks.append(dzestPoga);
  li.append(info, labaisBloks);

  return li;
}

function atjaunotSarakstu() {
  const normalizetsVaicajums = normalizetTekstu(meklesanasVaicajums.trim());

  const redzamie = izdevumi.filter((ieraksts) => {
    const atbilstKategorijai =
      aktivaKategorija === "Visi" || ieraksts.kategorija === aktivaKategorija;

    const atbilstMeklesanai =
      normalizetsVaicajums === "" ||
      normalizetTekstu(ieraksts.apraksts).includes(normalizetsVaicajums);

    return atbilstKategorijai && atbilstMeklesanai;
  });

  sarakstsEl.replaceChildren();

  let kopejieCenti = 0;
  for (const ieraksts of redzamie) {
    kopejieCenti += ieraksts.summaCenti;
    sarakstsEl.appendChild(izveidotIzdevumaElementu(ieraksts));
  }

  kopsummaEl.textContent = formatetSummu(kopejieCenti);

  if (redzamie.length === 0) {
    if (izdevumi.length === 0) {
      tuksaisPazinojumsEl.textContent = "Pagaidām nav pievienots neviens izdevums.";
    } else if (normalizetsVaicajums !== "") {
      tuksaisPazinojumsEl.textContent = `Nav atrastu izdevumu vaicājumam "${meklesanasVaicajums.trim()}".`;
    } else {
      tuksaisPazinojumsEl.textContent = `Kategorijā "${aktivaKategorija}" nav reģistrētu izdevumu.`;
    }
    tuksaisPazinojumsEl.hidden = false;
  } else {
    tuksaisPazinojumsEl.hidden = true;
  }

  const skaits = redzamie.length;
  ierakstuSkaitsEl.textContent =
    skaits === 1 ? "1 ieraksts" : `${skaits} ieraksti`;
}

function dzestIzdevumu(id) {
  izdevumi = izdevumi.filter((ieraksts) => ieraksts.id !== id);
  saglabatIzdevumus(izdevumi);
  atjaunotSarakstu();
  atjaunotMenesaKopsavilkumu();
}

forma.addEventListener("submit", (notikums) => {
  notikums.preventDefault();
  notiritKludas();

  const kludas = [];
  const apraksts = aprakstaIevade.value.trim();
  const summasRezultats = parsetSummuCentos(summasIevade.value);
  const kategorija = kategorijasIevade.value;
  const datums = datumaIevade.value;
  const atkartot = atkartotIevade.value;

  if (apraksts.length === 0) {
    kludas.push({
      lauks: aprakstaIevade,
      teksts: "Lūdzu, ievadiet izdevuma aprakstu.",
    });
  }

  if (!summasRezultats.derigs) {
    kludas.push({
      lauks: summasIevade,
      teksts: summasRezultats.kluda,
    });
  }

  if (!ATLAUTAS_KATEGORIJAS.includes(kategorija)) {
    kludas.push({
      lauks: kategorijasIevade,
      teksts: "Lūdzu, izvēlieties derīgu kategoriju.",
    });
  }

  if (!irDerigsKalendaraDatums(datums)) {
    kludas.push({
      lauks: datumaIevade,
      teksts: "Lūdzu, izvēlieties derīgu datumu.",
    });
  }

  if (!ATLAUTIE_ATKARTOJUMI.includes(atkartot)) {
    kludas.push({
      lauks: atkartotIevade,
      teksts: "Lūdzu, izvēlieties derīgu atkārtošanas režīmu.",
    });
  }

  if (kludas.length > 0) {
    paraditKludas(kludas);
    return;
  }

  const jaunsIzdevums = {
    id: generetUnikaluId(),
    apraksts,
    summaCenti: summasRezultats.summaCenti,
    kategorija,
    datums,
    atkartot,
    avotaId: null,
  };

  const atjaunotie = sakartotIzdevumus([jaunsIzdevums, ...izdevumi]);
  const saglabats = saglabatIzdevumus(atjaunotie);

  if (!saglabats) {
    paraditKludas([
      {
        lauks: null,
        teksts: "Neizdevās saglabāt izdevumu pārlūkprogrammas krātuvē.",
      },
    ]);
    return;
  }

  izdevumi = atjaunotie;
  aprakstaIevade.value = "";
  summasIevade.value = "";
  atkartotIevade.value = "nav";
  if (!datumaIevade.value) {
    datumaIevade.value = iegutSodienasDatumu();
  }

  atjaunotSarakstu();
  atjaunotMenesaKopsavilkumu();
  aprakstaIevade.focus();
});

for (const poga of filtraPogas) {
  poga.addEventListener("click", () => {
    const izveleta = poga.dataset.kategorija || "Visi";
    aktivaKategorija = izveleta;

    for (const citaPoga of filtraPogas) {
      citaPoga.classList.toggle("aktiva", citaPoga === poga);
    }

    atjaunotSarakstu();
  });
}

meklesanasIevade.addEventListener("input", () => {
  meklesanasVaicajums = meklesanasIevade.value;
  atjaunotSarakstu();
});

eksportetCsvPoga.addEventListener("click", eksportetCSV);

menesaIzvele.addEventListener("change", () => {
  izveletaisMenesis = menesaIzvele.value;
  atjaunotMenesaKopsavilkumu();
});

datumaIevade.value = iegutSodienasDatumu();
atjaunotSarakstu();
atjaunotMenesaKopsavilkumu();
