const GLABATUVES_ATSLEGA = "pd3-izdevumi";
const ATLAUTAS_KATEGORIJAS = [
  "Pārtika",
  "Transports",
  "Mājoklis",
  "Izklaide",
  "Veselība",
  "Cits",
];

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

let aktivaKategorija = "Visi";
let izdevumi = ieladetIzdevumus();

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

function generetUnikaluId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `izd-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function irDerigsIeraksts(ieraksts) {
  return (
    Boolean(ieraksts) &&
    typeof ieraksts === "object" &&
    typeof ieraksts.id === "string" &&
    ieraksts.id.trim().length > 0 &&
    typeof ieraksts.apraksts === "string" &&
    ieraksts.apraksts.trim().length > 0 &&
    Number.isInteger(ieraksts.summaCenti) &&
    ieraksts.summaCenti > 0 &&
    ATLAUTAS_KATEGORIJAS.includes(ieraksts.kategorija) &&
    irDerigsKalendaraDatums(ieraksts.datums)
  );
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
  info.append(aprakstsEl, metadati);

  const labaisBloks = document.createElement("div");
  labaisBloks.className = "izdevuma-labais";

  const summaEl = document.createElement("span");
  summaEl.className = "izdevuma-summa";
  summaEl.textContent = formatetSummu(ieraksts.summaCenti);

  const dzestPoga = document.createElement("button");
  dzestPoga.type = "button";
  dzestPoga.className = "poga-dzest";
  dzestPoga.textContent = "Dzēst";
  dzestPoga.setAttribute("aria-label", `Dzēst izdevumu: ${ieraksts.apraksts}`);
  dzestPoga.addEventListener("click", () => {
    dzestIzdevumu(ieraksts.id);
  });

  labaisBloks.append(summaEl, dzestPoga);
  li.append(info, labaisBloks);

  return li;
}

function atjaunotSarakstu() {
  const redzamie =
    aktivaKategorija === "Visi"
      ? izdevumi
      : izdevumi.filter((ieraksts) => ieraksts.kategorija === aktivaKategorija);

  sarakstsEl.replaceChildren();

  let kopejieCenti = 0;
  for (const ieraksts of redzamie) {
    kopejieCenti += ieraksts.summaCenti;
    sarakstsEl.appendChild(izveidotIzdevumaElementu(ieraksts));
  }

  kopsummaEl.textContent = formatetSummu(kopejieCenti);

  if (redzamie.length === 0) {
    tuksaisPazinojumsEl.textContent =
      izdevumi.length === 0
        ? "Pagaidām nav pievienots neviens izdevums."
        : `Kategorijā "${aktivaKategorija}" nav reģistrētu izdevumu.`;
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
}

forma.addEventListener("submit", (notikums) => {
  notikums.preventDefault();
  notiritKludas();

  const kludas = [];
  const apraksts = aprakstaIevade.value.trim();
  const summasRezultats = parsetSummuCentos(summasIevade.value);
  const kategorija = kategorijasIevade.value;
  const datums = datumaIevade.value;

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
  if (!datumaIevade.value) {
    datumaIevade.value = iegutSodienasDatumu();
  }

  atjaunotSarakstu();
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

datumaIevade.value = iegutSodienasDatumu();
atjaunotSarakstu();
