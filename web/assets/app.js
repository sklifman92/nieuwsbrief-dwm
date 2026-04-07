/**
 * Weekbrief — React Applicatie
 * Huisstijl: navy #18475D · koraal #E45D50 · framboos #CC3366
 * Krantopmaak met Playfair Display + Lora + Unsplash-foto's per categorie
 */

const { useState, useEffect, useRef } = React;

// ─── Analytics ───────────────────────────────────────────────────────────────

const Analytics = (() => {
  function getDeviceId() {
    let id = localStorage.getItem("dwm_device_id");
    if (!id) { id = crypto.randomUUID(); localStorage.setItem("dwm_device_id", id); }
    return id;
  }

  function getSessieId() {
    let id = sessionStorage.getItem("dwm_sessie_id");
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem("dwm_sessie_id", id); }
    return id;
  }

  function stuur(payload) {
    try {
      fetch("/api/pageview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: getDeviceId(), sessie_id: getSessieId(), ...payload }),
      }).catch(() => {});
    } catch {}
  }

  return {
    _deviceId: getDeviceId,
    pageview(pagina, editie_id = null) {
      stuur({ pagina, editie_id: editie_id || undefined });
    },
    artikelOpen(artikel_id, editie_id, pagina = "week") {
      stuur({ pagina, editie_id, artikel_id });
    },
    leestijd(artikel_id, editie_id, seconden) {
      if (seconden < 3) return;
      fetch("/api/leestijd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: getDeviceId(),
          sessie_id: getSessieId(),
          artikel_id, editie_id,
          seconden: Math.min(Math.round(seconden), 3600),
        }),
      }).catch(() => {});
    },
  };
})();

// ─── Categorie configuratie ───────────────────────────────────────────────────

const CATEGORIE = {
  "Gemeentes": {
    kleur: "#1A5276",
    label: "Gemeentes",
    img: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80&auto=format&fit=crop",
  },
  "Woningcorporaties": {
    kleur: "#1E8449",
    label: "Corporaties",
    img: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&auto=format&fit=crop",
  },
  "Bouwondernemingen": {
    kleur: "#784212",
    label: "Bouw & Ontwikkeling",
    img: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&auto=format&fit=crop",
  },
  "Adviesbureaus": {
    kleur: "#512E5F",
    label: "Adviesbureaus",
    img: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80&auto=format&fit=crop",
  },
  "Installatiebedrijven": {
    kleur: "#B7770D",
    label: "Installatie",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format&fit=crop",
  },
  "Energiecoöperaties": {
    kleur: "#117A65",
    label: "Coöperaties",
    img: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80&auto=format&fit=crop",
  },
  "Vastgoedonderhoudsbedrijven": {
    kleur: "#566573",
    label: "Vastgoed",
    img: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80&auto=format&fit=crop",
  },
  "Netbeheer & congestie": {
    kleur: "#C0392B",
    label: "Netbeheer",
    img: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80&auto=format&fit=crop",
  },
  "Beleid & regelgeving": {
    kleur: "#1A5276",
    label: "Beleid",
    img: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80&auto=format&fit=crop",
  },
  "Onderzoek & wetenschap": {
    kleur: "#6C3483",
    label: "Onderzoek",
    img: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800&q=80&auto=format&fit=crop",
  },
  "Technologie & innovatie": {
    kleur: "#B7770D",
    label: "Technologie",
    img: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80&auto=format&fit=crop",
  },
  "Projecten & praktijk": {
    kleur: "#E45D50",
    label: "Projecten",
    img: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80&auto=format&fit=crop",
  },
  "Markt & business": {
    kleur: "#0E6655",
    label: "Markt",
    img: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80&auto=format&fit=crop",
  },
  "Spotlight": {
    kleur: "#18475D",
    label: "Spotlight",
    img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&auto=format&fit=crop",
  },
  "Redactioneel": {
    kleur: "#CC3366",
    label: "Redactioneel",
    img: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&q=80&auto=format&fit=crop",
  },
};

function catKleur(cat) { return (CATEGORIE[cat] || {}).kleur || "#18475D"; }
function catLabel(cat) { return (CATEGORIE[cat] || {}).label || cat; }
// Geeft img-props terug: bronafbeelding → categorie-afbeelding → gegenereerde SVG
// Geen React state — directe DOM-mutatie om render-loops te vermijden.
function imgProps(artikel) {
  const catImg = (CATEGORIE[artikel.categorie] || {}).img || "";
  const bronUrl = (artikel.bronnen || [])
    .map(b => b && b.img_url)
    .find(url => typeof url === "string" && /^https?:\/\//i.test(url)) || "";

  const kandidaten = [bronUrl, catImg].filter(Boolean);
  const src = kandidaten[0] || catImg;

  function onError(e) {
    const huidig = Number(e.currentTarget.dataset.fallbackIndex || 0);
    const volgend = huidig + 1;
    if (volgend < kandidaten.length) {
      e.currentTarget.dataset.fallbackIndex = String(volgend);
      e.currentTarget.src = kandidaten[volgend];
    } else {
      e.currentTarget.onerror = null;
    }
  }

  return { src, onError };
}

// ─── Opslag ───────────────────────────────────────────────────────────────────

const PRE = "dwm:";

function slaEditieOp(id, data) {
  try { localStorage.setItem(`${PRE}editie:${id}`, JSON.stringify(data)); } catch(e) {}
}
function laadEditie(id) {
  try { const r = localStorage.getItem(`${PRE}editie:${id}`); return r ? JSON.parse(r) : null; } catch { return null; }
}
function lijstEdities() {
  const lijst = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(`${PRE}editie:`)) lijst.push(k.replace(`${PRE}editie:`, ""));
  }
  return lijst.sort().reverse();
}
function setActueel(id) { localStorage.setItem(`${PRE}actueel`, id); }
function getActueel()    { return localStorage.getItem(`${PRE}actueel`); }

async function laadPubliekeEdities() {
  const response = await fetch("data/edities/index.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Kon edities-index niet laden (${response.status})`);

  const manifest = await response.json();
  const items = Array.isArray(manifest.edities) ? manifest.edities : [];

  const resultaten = await Promise.all(
    items.map(async (item) => {
      if (!item?.id || !item?.path) return null;
      const editieResponse = await fetch(item.path, { cache: "no-store" });
      if (!editieResponse.ok) throw new Error(`Kon editie ${item.id} niet laden (${editieResponse.status})`);
      const editie = await editieResponse.json();
      slaEditieOp(item.id, editie);
      return item.id;
    })
  );

  return resultaten.filter(Boolean);
}

// Verwijder <<Categorie:>> prefix uit titels (legacy kop-formaat van agent)
function stripKop(titel) {
  if (!titel) return "";
  return String(titel).replace(/^<<[^>]*>>\s*/u, "").trim();
}

// ─── Datum helpers ─────────────────────────────────────────────────────────────

function formatDatum(iso, stijl = "medium") {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("nl-NL", {
      day: "numeric",
      month: stijl === "kort" ? "short" : "long",
      year: stijl === "lang" ? "numeric" : undefined,
    });
  } catch { return iso; }
}

function weekPeriode(start, eind) {
  if (!start) return "";
  if (!eind) return formatDatum(start, "lang");
  const s = new Date(start);
  const e = new Date(eind);
  const opties = { day: "numeric", month: "long" };
  return `${s.toLocaleDateString("nl-NL", opties)} — ${e.toLocaleDateString("nl-NL", { ...opties, year: "numeric" })}`;
}

// ─── Demo-editie ──────────────────────────────────────────────────────────────

const DEMO = {
  editie: "2026-W14",
  jaar: 2026,
  weeknummer: 15,
  datum_start: "2026-04-01",
  datum_eind: "2026-04-07",
  datum_publicatie: "2026-04-03",
  highlights: [
    "Utrecht stelt wijkuitvoeringsplan Overvecht vast: 3.200 woningen op ZLT-warmtenet vanaf 2027",
    "Enexis: nieuwe congestiegebieden in Twente en Noord-Brabant door warmtepompuitrol",
    "TNO evalueert vijf jaar 5GDHC: efficiëntie stijgt, maar opschaling stagneert",
    "Aedes: corporaties verduurzamen 28% sneller dan het NPA-schema voorschrijft",
  ],
  artikelen: [
    {
      id: "2026-W14-01",
      categorie: "Gemeentes",
      titel: "Utrecht stelt wijkuitvoeringsplan Overvecht definitief vast",
      lead: "De gemeente Utrecht heeft het WUP voor Overvecht gepubliceerd. Het plan voorziet in de aansluiting van 3.200 woningen op een ZLT-warmtenet in de periode 2027–2032 en wordt gezien als een van de meest ambitieuze warmtetransitieplannen in stedelijk Nederland.",
      body: "De gemeente Utrecht heeft vorige week het definitieve wijkuitvoeringsplan (WUP) voor de wijk Overvecht vastgesteld en gepubliceerd. Na twee jaar van consultatie, technische verkenning en financiële doorrekening geeft het plan nu eindelijk uitsluitsel over hoe 3.200 woningen in de periode 2027 tot 2032 stap voor stap worden losgekoppeld van het aardgasnet. Het is het eerste WUP in Utrecht dat expliciet kiest voor een ZLT-warmtenet als collectieve alternatieve verwarmingsinfrastructuur — een keuze die de gemeente motiveert vanuit zowel technische als sociale overwegingen.\n\nHet warmtenet werkt op lage temperatuur: het bronnet circuleert water op 15 tot 25 graden Celsius en koppelt daarmee aan individuele warmtepompen per woning of per blok. Als warmtebron is gekozen voor een combinatie van restwarmte uit de Rijn en seizoensopslag via twee ondergrondse aquiferopslagsystemen (ATES). De gekozen topologie maakt het systeem robuuster dan een enkelvoudige warmtebron en biedt ruimte om in de toekomst extra bronnen — zoals restwarmte van datacenters of industrieterreinen — aan het net te koppelen.\n\nDe totale investering wordt geraamd op circa 85 miljoen euro, waarvan 12 miljoen euro is gedekt via de PAW-subsidie (Proeftuinen Aardgasvrij Wijken). Het resterende bedrag wordt gefinancierd via een combinatie van gemeentelijk kapitaal, bijdragen van woningcorporaties Mitros en Bo-Ex, en een langlopende lening via het Nationaal Warmtefonds. De netbeheerder Stedin neemt de elektriciteitsinfrastructuur voor zijn rekening, die versterkt moet worden om de extra vraag van de warmtepompen op te vangen.\n\nEen belangrijk aandachtspunt in het plan is de betaalbaarheid voor huurders. Wethouder Van den Berg benadrukt dat het warmtenet niet mag leiden tot hogere energielasten voor bewoners met een laag inkomen: „We laten zien dat een aardgasvrije wijk ook voor huurders betaalbaar kan zijn.“ In de plannen is opgenomen dat de energierekening van bewoners na overstap niet hoger mag zijn dan de huidige gasrekening, inclusief vaste kosten. Om dit te borgen wordt samengewerkt met het Warmtefonds en worden bewoners ondersteund via een keuzegidstraject.\n\nKritische kanttekeningen zijn er ook. De bewonersvereniging Overvecht heeft in de consultatieronde aangegeven zorgen te hebben over de uitvoeringstermijn: de aanleg van 3.200 aansluitingen in vijf jaar vereist een aanzienlijke bouworganisatie die in de regio niet vanzelfsprekend beschikbaar is. Ook de afhankelijkheid van één netbeheerder voor zowel het warmtenet als de elektriciteitsverzwaring wordt door sommige raadsleden als een risico gezien. De gemeente stelt dat er een onafhankelijke toezichtscommissie wordt ingesteld die de voortgang jaarlijks evalueert.\n\nDe eerste aansluitingen staan gepland voor het eerste kwartaal van 2027, te beginnen in de deelbuurt Overvecht-Noord waar de woningdichtheid het hoogst is en corporatiewoningen de overgrote meerderheid vormen. Parallel wordt gewerkt aan een communicatiecampagne richting eigenaar-bewoners, voor wie deelname vrijwillig is maar financieel sterk gestimuleerd wordt via een eenmalige aansluitsubsidie.",
      is_hero: true,
      bronnen: [{ naam: "Gemeente Utrecht", url: "https://www.utrecht.nl", type: "overheid", datum_publicatie: "2026-03-28" }],
      woorden: 498,
    },
    {
      id: "2026-W14-02",
      categorie: "Netbeheer & congestie",
      titel: "Enexis: twee nieuwe congestiegebieden door versnelde warmtepompuitrol",
      lead: "Netbeheerder Enexis heeft zijn congestiekaart bijgewerkt met twee nieuwe probleemgebieden in Twente en Noord-Brabant. De directe aanleiding is de snellere-dan-verwachte uitrol van warmtepompen in nieuwbouw- en renovatieprojecten.",
      body: "Enexis heeft zijn openbare congestiekaart deze week bijgewerkt en twee nieuwe gebieden aangemerkt waar de transportcapaciteit op het laagspanningsnet tijdelijk is uitgeput. Het gaat om de regio Enschede-Noord in Twente en de omgeving Helmond-Oost in Noord-Brabant. In beide gevallen is de directe aanleiding een combinatie van nieuwbouwoplevering en grootschalige renovatie waarbij all-electric verwarmingssystemen — met name lucht-water warmtepompen — in korte tijd op hetzelfde netdeel worden aangesloten.\n\nIn Enschede-Noord gaat het om een woonwijk van circa 1.400 woningen die in 2024 en 2025 zijn opgeleverd en standaard zijn uitgerust met warmtepompen. Samen met een nabijgelegen bedrijventerrein dat deels op elektrisch verwarmen is overgestapt, heeft dit geleid tot een piekbelasting die het bestaande middenspanningstrafostation overschrijdt. Enexis schat in dat de netversterking — het plaatsen van een extra transformator en kabelverzwaring — minimaal 18 maanden in beslag neemt. In de tussenperiode geldt een aansluitstop voor nieuwe grootverbruikers en warmtenetprojecten boven 150 kW.\n\nIn Helmond-Oost is de situatie iets anders. Daar is sprake van een ouder wijknet dat door jarenlange onderinvestering sowieso aan het einde van zijn technische levensduur zit. De plotselinge toename van warmtepompen — als gevolg van een grootschalig renovatietraject van woningcorporatie Woonbedrijf — heeft dit netdeel over de capaciteitsgrens geduwd. Enexis geeft aan dat de integrale vernieuwing van het net hier meerdere jaren in beslag zal nemen. Nieuwe warmteprojecten in het gebied worden gevraagd om vroegtijdig overleg te starten en te kijken naar alternatieve aansluitpunten of tijdelijke buffering.\n\nBrancheorganisaties reageerden kritisch op de publicatie. Techniek Nederland stelt dat de netbeheerders onvoldoende vooruit plannen: „De congestie in Helmond was al maanden geleden voorzienbaar op basis van de vergunde bouwprojecten. Eerder ingrijpen had veel van deze vertraging kunnen voorkomen.“ Enexis erkent dat het planningsproces voor netuitbreiding beter moet aansluiten op de gemeentelijke warmtevisies, maar wijst ook op capaciteitsproblemen aan de kant van aannemers en leveranciers van netonderdelen.\n\nVoor projectontwikkelaars en warmtebedrijven die actief zijn in de aangewezen gebieden heeft de congestie directe gevolgen. Projecten die nog geen netaansluiting hebben, kunnen rekenen op aanmerkelijke vertraging. Enexis adviseert om de netaanvraag zo vroeg mogelijk in te dienen — bij voorkeur al in de fase van de omgevingsvergunning — en te verkennen of deelname aan een congestiedienstenprogramma (flexibele belasting, batterijopslag) de wachttijd kan verkorten.\n\nDe verwachting is dat dit niet de laatste congestie-update van dit jaar zal zijn. Met de aanhoudende uitrol van warmtepompen in het kader van gemeentelijke WUP's en de NPA-doelstellingen staan meerdere netdelen in het land onder druk. Enexis kondigt aan voor de zomer een uitgebreidere congestieprognose te publiceren op basis van de meest recente warmtetransitieplannen van gemeenten.",
      is_hero: false,
      bronnen: [{ naam: "Enexis", url: "https://www.enexis.nl", type: "netbeheerder", datum_publicatie: "2026-03-29" }],
      woorden: 512,
    },
    {
      id: "2026-W14-03",
      categorie: "Onderzoek & wetenschap",
      titel: "TNO evalueert vijf jaar 5GDHC in Nederland: efficiëntie omhoog, opschaling stokt",
      lead: "TNO publiceerde een grondig evaluatierapport van veertien 5GDHC-projecten die de afgelopen vijf jaar operationeel zijn geworden in Nederland. De technische prestaties verbeteren zichtbaar, maar de weg van proeftuin naar grootschalige uitrol blijkt beduidend langer dan verwacht.",
      body: "Vijf jaar nadat de eerste vijfde-generatie stadsverwarming- en koelingssystemen (5GDHC) in Nederland in bedrijf gingen, heeft TNO een uitgebreide evaluatie gepubliceerd. Het rapport analyseert veertien projecten, variërend van kleine buurtnetten van honderd woningen tot complexere systemen met meer dan tweeduizend aansluitingen. De conclusie is tweeledig: technisch presteren de systemen beter dan vijf jaar geleden, maar de vertaling naar grootschalige, herhaalbare uitrol laat nog op zich wachten.\n\nOp het gebied van energie-efficiëntie laat het rapport duidelijke verbeteringen zien. De gemiddelde Seasonal Performance Factor (SPF) van de aangesloten warmtepompen is gestegen van 3,1 in 2021 naar 3,8 in 2025. Die verbetering is volgens TNO voor het grootste deel toe te schrijven aan twee factoren: betere regeltechniek van het bronnet, waardoor de temperatuur nauwkeuriger wordt afgestemd op de actuele warmte- en koedevraag, en verbeterde inregeling van de individuele warmtepompinstallaties na de eerste winter. In de projecten waar een professionele beheerder verantwoordelijk is voor de optimalisatie, liggen de SPF-waarden structureel hoger dan in projecten waar bewoners zelf verantwoordelijk zijn voor de instelling.\n\nWaar het rapport kritischer is, is op het vlak van opschaling. Van de veertien geëvalueerde projecten zijn er slechts drie doorgegaan naar een tweede of derde uitbreidingsfase. De overige elf bevinden zich nog steeds in de pilotstatus, ook al draaien ze technisch gezien volledig operationeel. TNO wijst drie structurele knelpunten aan: de hoge aanlegkosten van het ondergrondse leidingnet (gemiddeld 4.200 euro per aansluiting, tegenover 2.700 euro voor een conventioneel warmtenet op hoger temperatuurniveau), het ontbreken van gestandaardiseerde koppelvlakken tussen de broninstallatie en de individuele warmtepompen, en een tekort aan installateurs die ervaring hebben met het specifieke inregelen van 5GDHC-systemen.\n\nEen bevinding die extra aandacht verdient, is de variatie in bewonerstevredenheid. In drie van de veertien projecten rapporteren bewoners aanhoudende problemen met de tapwatertemperatuur: bij ZLT-systemen moet de individuele warmtepomp het warme tapwater opwarmen tot minimaal 60 graden om legionellarisico te voorkomen, wat in de praktijk leidt tot een langere opwarmtijd en hogere elektriciteitsvraag dan bewoners gewend zijn. TNO beveelt aan om bij toekomstige projecten de bewonersopvang op dit punt te versterken en installatietechnisch te kiezen voor systemen met een geïntegreerde boilerfunctie.\n\nTNO doet in het rapport concrete aanbevelingen voor de volgende fase: investeer in een nationaal kennisplatform voor 5GDHC-data, ontwikkel een open standaard voor de koppeling van bronnet naar gebouwinstallatie, en organiseer een gezamenlijk opleidingsprogramma voor installateurs in samenwerking met de brancheorganisaties. Het rapport is opgesteld in opdracht van het Ministerie van Klimaat en Groene Groei en zal worden gebruikt als input voor de evaluatie van de warmtetransitie-instrumenten in de Miljoenennota 2027.",
      is_hero: false,
      bronnen: [{ naam: "TNO", url: "https://www.tno.nl", type: "research", datum_publicatie: "2026-04-01" }],
      woorden: 534,
    },
    {
      id: "2026-W14-04",
      categorie: "Beleid & regelgeving",
      titel: "Minister wil Wcw versnellen: eerder zekerheid voor gemeenten en warmtebedrijven",
      lead: "De minister heeft in een Kamerbrief aangekondigd de inwerkingtreding van de Wet collectieve warmtevoorziening te willen vervroegen. Gemeenten en warmtebedrijven die nu al plannen maken, lopen vast op het ontbreken van het wettelijke kader.",
      body: "In een brief aan de Tweede Kamer heeft de minister van Klimaat en Groene Groei laten weten actief te onderzoeken of de Wet collectieve warmtevoorziening (Wcw) eerder in werking kan treden dan de eerder gecommuniceerde streefdatum van 1 januari 2027. Aanleiding is een toenemende stroom van signalen uit gemeenten en warmtebedrijven dat het uitblijven van de wet investeringsbeslissingen blokkeert en planprocessen vertraagt. De minister wil dit knelpunt wegnemen.\n\nDe Wcw is de opvolger van de huidige Warmtewet en beoogt een fundamentele herziening van het wettelijke kader voor collectieve warmtelevering. De wet introduceert een concessiestelsel waarbij gemeenten de exclusieve aanleg en exploitatie van warmtenetten kunnen gunnen aan één warmtebedrijf voor een bepaalde wijk of gebied. Daarmee krijgen gemeenten meer regie, maar ook meer verantwoordelijkheid. Tegelijkertijd regelt de wet de tariefstelling via ACM, met als doel te voorkomen dat bewoners afhankelijk zijn van een monopolist zonder enige prijsregulering.\n\nDe kern van het probleem is dat het ontbreken van de Wcw leidt tot een juridisch vacuüm. Gemeenten die nu een warmtenet willen aanbesteden, kunnen dat niet doen op basis van het toekomstige concessiestelsel, maar moeten terugvallen op de bestaande Aanbestedingswet — een omweg die de procedures verlengt, de rechtszekerheid verkleint en warmtebedrijven afschrikt om in te schrijven. Warmtebedrijf Rotterdam heeft openlijk aangegeven dat twee lopende projecten in de ijskast zijn gezet totdat de Wcw in werking is.\n\nBrancheorganisatie Warmtenetwerk Nederland reageerde positief op de aankondiging: „Elke maand vertraging kost ons projecten die we niet meer inlopen. De minister heeft een goed signaal gegeven.“ Toch klinken er ook voorzichtige geluiden. Stichting Natuur en Milieu wees erop dat de wet in de huidige vorm nog onvoldoende waarborgen biedt voor duurzaamheidseisen aan de warmtebron. Zij pleiten voor een verankering in de wet dat warmtenetten na 2030 uitsluitend op duurzame bronnen mogen draaien, als voorwaarde voor het verlenen van een concessie.\n\nVanuit juridisch perspectief is vervroegde inwerkingtreding niet zonder risico. Uitvoeringsorganisaties, gemeenten en warmtebedrijven hebben implementatietijd nodig om zich voor te bereiden op de nieuwe verplichtingen. De Vereniging van Nederlandse Gemeenten (VNG) heeft in een reactie gesteld dat een minimale implementatietermijn van zes maanden na publicatie in het Staatsblad noodzakelijk is. De minister heeft toegezegd dit mee te nemen in het onderzoek en de Kamer voor de zomer te informeren over de exacte planning.",
      is_hero: false,
      bronnen: [{ naam: "Rijksoverheid", url: "https://www.rijksoverheid.nl", type: "overheid", datum_publicatie: "2026-03-31" }],
      woorden: 483,
    },
    {
      id: "2026-W14-05",
      categorie: "Projecten & praktijk",
      titel: "ZLT-proeftuin Almere-Poort bereikt mijlpaal: 500 woningen volledig operationeel",
      lead: "In Almere-Poort zijn 500 woningen nu volledig operationeel aangesloten op het ZLT-warmtenet. Het eerste volledige stookseizoen leverde verrassend goede resultaten op — maar ook leerpunten die relevant zijn voor elk toekomstig 5GDHC-project.",
      body: "De ZLT-proeftuin Almere-Poort heeft een significante mijlpaal bereikt. Alle 500 woningen in de eerste fase zijn nu volledig operationeel: bewoners worden verwarmd en gekoeld via het buurtnet, de individuele warmtepompen draaien stabiel en het monitoringsysteem verzamelt real-time data over het energiegebruik en de systeemprestaties. Het is daarmee een van de grootste operationele ZLT-systemen in Nederland.\n\nHet eerste volledige stookseizoen — winter 2025–2026 — verliep beter dan de prognoses. De gemiddelde elektriciteitsvraag per woning voor ruimteverwarming en tapwater kwam uit op 3.200 kWh per jaar, ruim onder de geraamde 3.800 kWh. Projectbeheerder Alliander attribeert dit deels aan het milde winterseizoen, maar ook aan de professionele inregeling van het systeem. Na twee maanden heeft het beheerteem het bronnet bijgesteld op basis van de gemeten vraagpatronen, waarna de SPF van de warmtepompen met gemiddeld 0,4 punt verbeterde — een betekenisvolle winst op systeemniveau.\n\nMinder rooskleurig was de situatie rond tapwater. In de eerste maanden na oplevering kwamen bij circa 80 huishoudens klachten binnen over te lange wachttijden voor warm tapwater. Analyse wees uit dat de warmtepompen in die woningen niet optimaal waren ingesteld voor de verhouding tussen ruimteverwarming en tapwaterproductie. Na gerichte herconfiguratie door de installateur zijn de klachten in het overgrote deel van de gevallen opgelost. Het incident onderstreept het belang van een goede overdracht tussen installateur en bewoner, en van een bereikbare klantenservice in de eerste maanden na oplevering — iets wat Alliander nu expliciet heeft opgenomen in het dienstverleningsprotocol voor fase twee.\n\nFinancieel laat het project een neutraal beeld zien. De energierekening van huurders die vanuit een goed geïsoleerde woningcorporatiewoning zijn overgestapt, is gemiddeld gelijk gebleven aan de vorige gassituatie. Voor eigenaar-bewoners die vóór de overstap relatief inefficiënte cv-ketels hadden, is er in veel gevallen sprake van een verlaging van de energiekosten. Er zijn echter ook gevallen — met name in woningen met een relatief hoge tapwatervraag, zoals grote gezinnen — waar de jaarlijkse kosten licht zijn gestegen. Alliander en de gemeente Almere onderzoeken hoe de tariefstelling beter op gebruikspatronen kan worden afgestemd.\n\nDe tweede fase van het project start in de zomer van 2026. In die fase worden nog eens 800 woningen aangesloten, inclusief een schoolgebouw en een gezondheidscentrum. Tegelijkertijd wordt gewerkt aan de uitbreiding van de opslagcapaciteit: een tweede ATES-doublet wordt geboord om de seizoensbalans van het systeem te verbeteren en minder afhankelijk te worden van elektriciteit in de koudste winterweken. De ervaringen uit fase één worden actief gedeeld via het kennisplatform van Stichting Warmtenetwerk, zodat andere gemeenten en projectontwikkelaars van de leerpunten kunnen profiteren.",
      is_hero: false,
      bronnen: [{ naam: "Stichting Warmtenetwerk", url: "https://www.warmtenetwerk.nl", type: "brancheorg", datum_publicatie: "2026-04-01" }],
      woorden: 527,
    },
    {
      id: "2026-W14-06",
      categorie: "Woningcorporaties",
      titel: "Aedes: corporaties 28% voor op verduurzamingsschema, maar regionale kloof groeit",
      lead: "Woningcorporaties verduurzamen in hoog tempo, zo blijkt uit de kwartaalrapportage van Aedes. Maar achter de positieve landelijke cijfers gaat een toenemende tweedeling schuil tussen corporaties in groeigebieden en die in krimpregio's.",
      body: "De meest recente kwartaalrapportage van Aedes, de koepelorganisatie van woningcorporaties, laat landelijk een opvallend positief beeld zien: het aantal corporatiewoningen dat is aangesloten op een collectief warmtesysteem — warmtenet, WKO of lucht-water warmtepomp op buurtniveau — is het afgelopen jaar met 28% gegroeid. Dat ligt fors boven de 20% groei die was voorzien in de Nationale Prestatieafspraken (NPA). In absolute aantallen betekent dit dat er in twaalf maanden tijd ruim 41.000 extra corporatiewoningen van het gasnet zijn losgekoppeld.\n\nDe motor achter deze groei ligt duidelijk in de grotere steden. Amsterdam, Rotterdam, Utrecht en Den Haag samen vertegenwoordigen meer dan de helft van de nieuwe aansluitingen. Dat is geen toeval: in die gemeenten is sprake van actieve warmtetransitievisies, concrete WUP's, en in sommige gevallen directe financiële participatie van de gemeente in de warmteinfrastructuur. Corporaties in die gebieden kunnen profiteren van een bestaand of in aanbouw zijnd warmtenet, waarbij de aansluitkosten per woning relatief laag zijn door de schaalvoordelen.\n\nHet beeld buiten de Randstad en de grote steden is beduidend minder positief. In krimpgebieden — provincies als Groningen, Zeeland en Limburg — lopen corporaties gemiddeld 12% achter op het NPA-schema. De redenen zijn divers: een lagere woningdichtheid maakt collectieve warmtenetten economisch minder aantrekkelijk, de investeringsruimte van corporaties in deze gebieden is kleiner door een lagere huurinkomstenbasis, en gemeenten hebben minder capaciteit om de planvorming te begeleiden. Aedes spreekt in het rapport openlijk van een „regionale verdiepende kloof“ die aandacht verdient.\n\nHet rapport bevat ook een analyse van de financiering. De gemiddelde investering per woning voor aansluiting op een collectief warmtesysteem bedraagt momenteel 8.400 euro. Corporaties dekken dat voor een groot deel uit eigen vermogen en via de Warmteinvesteringssubsidie (WIS), maar de WIS is overbelast: de beschikbare middelen voor 2026 waren al in januari uitgeput, waardoor aanvragen die later in het jaar werden ingediend, naar 2027 zijn doorgeschoven. Aedes roept het kabinet op de WIS structureel te verhogen en de SDE++-regeling voor warmtenetten te verlengen voorbij 2028.\n\nEen ander thema dat in de rapportage naar voren komt, is de krapte op de arbeidsmarkt. De snelle groei van het aantal verduurzamingsprojecten stuit op een tekort aan technisch personeel: installateurs, werktuigbouwkundigen en projectmanagers met kennis van warmtetransitie zijn schaars. Twaalf corporaties gaven in de rapportage aan dat een lopend project vertraging heeft opgelopen door het niet kunnen vinden van gekwalificeerde aannemer of installateur. Aedes heeft samen met Bouwend Nederland en Techniek Nederland een gezamenlijk actieplan opgesteld om de capaciteit in de keten te vergroten, onder meer via versnelde opleidingstrajecten en werving vanuit aangrenzende sectoren.",
      is_hero: false,
      bronnen: [{ naam: "Aedes", url: "https://www.aedes.nl", type: "brancheorg", datum_publicatie: "2026-03-30" }],
      woorden: 543,
    },
    {
      id: "2026-W14-07",
      categorie: "Technologie & innovatie",
      titel: "Daikin lanceert R290-warmtepomp voor collectieve toepassingen",
      lead: "Daikin Europe heeft een nieuwe serie lucht-water warmtepompen op propaan (R290) geïntroduceerd die speciaal zijn ontworpen voor collectieve warmtelevering aan appartementen en kleine woonwijken.",
      body: "De nieuwe Daikin R290 District-serie is ontworpen voor vermogensklassen van 30 tot 120 kW en richt zich op kleinschalige collectieve warmtelevering: woonblokken, appartementencomplexen en kleinere VvE-projecten. Het gebruik van propaan als koudemiddel is een directe reactie op de nieuwe Europese F-gassenverordening die per 2025 de inzet van koudemiddelen met een hoog Global Warming Potential sterk aan banden legt. Propaan heeft een GWP van slechts 3 — ter vergelijking: het veelgebruikte R410A heeft een GWP van 2.088.\n\nTechnisch gezien scoort de R290-serie indrukwekkend. Daikin rapporteert een COP van gemiddeld 3,8 bij een buitentemperatuur van 7°C en een afgifte van 55°C, wat de warmtepomp geschikt maakt voor bestaande bouw met relatief hoge afgiftetemperaturen. Dat vergroot de toepasbaarheid aanzienlijk: in de corporatiesector, waar veel woningen nog radiatoren hebben die hogere watertemperaturen vereisen, was dit tot nu toe een struikelblok bij de inzet van warmtepompen.\n\nEen belangrijk aandachtspunt bij propaan is de veiligheidsregelgeving. Propaan is licht ontvlambaar, waardoor installateurs moeten voldoen aan aanvullende eisen rondom ventilatievoorzieningen in technische ruimten. Daikin heeft daarvoor een eigen trainingsprogramma ontwikkeld. Installatiebedrijven wijzen er echter op dat de bijscholingsverplichting extra druk legt op een toch al krappe arbeidsmarkt.\n\nDe komst van de R290-serie sluit aan op een bredere verschuiving in de markt. Buderus, Vaillant en Mitsubishi Electric hebben eerder dit jaar vergelijkbare modellen geïntroduceerd. Marktanalisten verwachten dat propaan tegen 2028 het dominante koudemiddel zal zijn in de warmtepompsector voor collectieve toepassingen in Europa.",
      is_hero: false,
      bronnen: [{ naam: "Daikin Europe", url: "https://www.daikin.eu", type: "leverancier", datum_publicatie: "2026-03-27" }],
      woorden: 255,
    },
    {
      id: "2026-W14-08",
      categorie: "Installatiebedrijven",
      titel: "Installatiebranche signaleert acuut tekort aan monteurs voor warmtenetten",
      lead: "Vijf van de tien grootste installatiebedrijven in Nederland melden dat projecten voor warmtenetten zijn vertraagd wegens gebrek aan gecertificeerd technisch personeel. De sector slaat alarm richting het kabinet.",
      body: "Het tekort aan monteurs in de installatiebranche is geen nieuw fenomeen, maar de snelle opschaling van het aantal warmtenetprojecten maakt het probleem urgent. In een enquête van Techniek Nederland geeft 62% van de geraadpleegde installatiebedrijven aan dat zij momenteel minstens één warmtenetproject hebben moeten uitstellen door gebrek aan geschikt personeel. Bij projecten waarbij ook 5GDHC-technologie — het zogenoemde vijfde generatie districtsverwarming- en koelnet — is betrokken, loopt dat percentage op tot 74%.\n\nHet probleem is meerledig. Ten eerste is 5GDHC een relatief nieuwe technologie waarvoor nog geen breed erkend opleidingspad bestaat. Monteurs moeten naast de gebruikelijke warmtepompkennis ook inzicht hebben in hydrologische bodemsystemen, automatisering en netbeheersystemen. Ten tweede trekken gemeenten en projectontwikkelaars steeds meer monteurs weg uit de reguliere onderhoudssector door betere arbeidsvoorwaarden te bieden, waardoor kleine installateurs kampen met een uitstroom van ervaren medewerkers.\n\nTechniek Nederland heeft samen met het ROC-netwerk een versneld mbo-4-certificeringstraject ontwikkeld voor thermische installaties. De eerste lichting van 340 cursisten is in januari gestart; naar verwachting stromen zij in september 2026 uit. Brancheorganisatie UNETO-VNI berekent dat er op dit moment minimaal 4.200 extra vakbekwame warmtepompmonteurs nodig zijn om de huidige projectpijplijn te realiseren. De kloof is dus aanzienlijk.\n\nDe oproep aan het kabinet is tweeledig: verhoog de subsidie voor leer-werktrajecten in de installatietechniek, en versnel de erkenning van buitenlandse vakdiploma's voor EU-monteurs die de Nederlandse arbeidsmarkt kunnen versterken.",
      is_hero: false,
      bronnen: [{ naam: "Techniek Nederland", url: "https://www.technieknederland.nl", type: "brancheorg", datum_publicatie: "2026-03-28" }],
      woorden: 268,
    },
    {
      id: "2026-W14-09",
      categorie: "Vastgoedonderhoudsbedrijven",
      titel: "Preventief onderhoud warmtepompen bespaart corporaties 18% op storingsherstel",
      lead: "Onderzoek van ISSO laat zien dat planmatig preventief onderhoud van warmtepompen in corporatiewoningen de kosten voor storingsherstel met gemiddeld 18% verlaagt. De terugverdientijd van een goed onderhoudscontract is minder dan twee jaar.",
      body: "ISSO — het kennisinstituut voor de installatiesector — heeft een analyse gepubliceerd op basis van storings- en onderhoudsdata van ruim 12.000 individuele warmtepompen in woningcorporatiebezit. De conclusie is ondubbelzinnig: corporaties met een periodiek preventief onderhoudscontract betalen gemiddeld 18% minder aan reactief storingsherstel dan corporaties die alleen reageren als een warmtepomp uitvalt. Wanneer ook de kosten van klachtenafhandeling en tijdelijke vervangingsmaatregelen worden meegenomen, loopt het verschil op tot 23%.\n\nPreventief onderhoud omvat in de studie: jaarlijkse inspectie van het koudemiddelcircuit, reinigen van filters en warmtewisselaars, controle van de elektrische installatie en het bijwerken van regelsoftware. De gemiddelde kosten van zo'n onderhoudsbeurt bedragen 185 euro per warmtepomp per jaar. De besparing op storingsherstel bedraagt gemiddeld 312 euro per warmtepomp per jaar. De netto besparing is daarmee 127 euro per eenheid, met een terugverdientijd van minder dan anderhalf jaar.\n\nEen bijkomend voordeel is de langere levensduur. Warmtepompen die preventief worden onderhouden, gaan gemiddeld 2,4 jaar langer mee dan vergelijkbare systemen zonder regelmatig onderhoud. Bij een vervangingswaarde van gemiddeld 6.800 euro per warmtepomp vertegenwoordigt dit een aanzienlijke extra waarde.\n\nVastgoedonderhoudsbedrijven spelen een sleutelrol. ISSO beveelt aan dat corporaties bij aanbesteding van onderhoudscontracten outputgerichte specificaties hanteren: niet het aantal onderhoudsbeurten per jaar, maar de gewenste beschikbaarheid van het systeem als contractparameter. Zo wordt de prikkel voor preventief gedrag bij de aannemer gelegd.",
      is_hero: false,
      bronnen: [{ naam: "ISSO", url: "https://www.isso.nl", type: "kennisinstituut", datum_publicatie: "2026-03-29" }],
      woorden: 263,
    },
    {
      id: "2026-W14-10",
      categorie: "Energiecoöperaties",
      titel: "Coöperaties bundelen zonnepark en WKO voor lokale warmtelevering in Zeist",
      lead: "Energiecoöperaties De Windvogel en ZLT Zeist starten een pilotproject waarbij opbrengsten uit een gezamenlijk zonnepark worden ingezet voor de financiering van WKO-warmtelevering aan 280 bestaande woningen.",
      body: "Het project in Zeist is een van de eerste in Nederland waarbij twee energiecoöperaties hun activiteiten structureel aan elkaar koppelen: De Windvogel levert kennis en kapitaal voor het zonnepark, terwijl ZLT Zeist de warmte-infrastructuur beheert en de warmtelevering aan leden organiseert. De combinatie is financieel aantrekkelijk: de elektriciteitsopbrengsten van het zonnepark worden deels ingezet om de exploitatiekosten van het WKO-systeem te dekken, waardoor leden een stabiel en relatief laag warmtetarief aangeboden krijgen.\n\nHet WKO-systeem werkt met een open bodemenergiesysteem op 80 meter diepte en levert warmte aan 280 woningen in de wijk Vollenhove. Technisch combineert het project seizoensopslag — warmte die in de zomer in de bodem wordt opgeslagen voor gebruik in de winter — met directe koeling in warme perioden, wat het systeem het hele jaar rendabel maakt. De COP over het gehele jaar wordt geraamd op 4,2.\n\nDe financieringsstructuur is bijzonder. Leden die participeren in het zonnepark ontvangen een korting op hun warmtetarief als tegenprestatie, naast het gebruikelijke rendement op hun obligatie. Dit creëert een geïntegreerde coöperatieve energiegemeenschap waarbij zowel de opwek als de warmtelevering lokaal wordt georganiseerd en beheerd door leden.\n\nHet project wordt gefinancierd met een combinatie van eigen coöperatief vermogen, een lening van het Nationaal Warmtefonds en een provinciale subsidiebijdrage van 15% op de WKO-investering. De gemeente heeft grond beschikbaar gesteld voor de technische installaties. Verwachte oplevering is het eerste kwartaal van 2027.",
      is_hero: false,
      bronnen: [{ naam: "De Windvogel / ZLT Zeist", url: "https://www.dewindvogel.nl", type: "coöperatie", datum_publicatie: "2026-03-26" }],
      woorden: 265,
    },
    {
      id: "2026-W14-11",
      categorie: "Bouwondernemingen",
      titel: "Woningbouwers: levertijden warmtepompsystemen stabiel, installatiecapaciteit is nu het knelpunt",
      lead: "Na jaren van ernstige problemen in de toeleveringsketen melden grote woningbouwers dat de levertijden voor warmtepompsystemen genormaliseerd zijn. Het nieuwe knelpunt zit in de installatiecapaciteit: er zijn onvoldoende monteurs om de beschikbare systemen tijdig in te bouwen.",
      body: "De supply chain-problemen die de bouwsector in 2022 en 2023 troffen — lange levertijden, schaarste aan chips en componenten, hoge prijzen — zijn grotendeels opgelost. Acht van de tien geraadpleegde woningbouwers in een enquête van Bouwend Nederland geven aan dat de leverbetrouwbaarheid van warmtepompen het afgelopen jaar aanzienlijk is verbeterd. Levertijden van meer dan 26 weken zijn teruggelopen naar gemiddeld 8 tot 12 weken, wat binnen normale projectplanningsmarges valt.\n\nDe opluchting over de verbeterde leverbetrouwbaarheid wordt echter overschaduwd door een nieuw capaciteitsprobleem: het tekort aan monteurs. Bouwbedrijven die woningen opleveren met een individuele warmtepomp of een aansluiting op een collectief warmtenet, zijn afhankelijk van installatiebedrijven voor de technische inbouw. Die bedrijven kampen zelf met personeelstekort, waardoor planningen uitlopen en woningen niet tijdig bewoonbaar zijn.\n\nVoor nieuwbouwprojecten met collectieve warmtenetten speelt nog een ander probleem: de aansluiting van een nieuwbouwwijk vereist afstemming met de netbeheerder, de warmteleverancier en de gemeente. Die afstemming kost tijd — in sommige gevallen meerdere maanden extra — en vertraagt de oplevering van complete bouwfases.\n\nBouwend Nederland dringt er bij het kabinet op aan om de erkenning van erkend leerbedrijven in de installatietechniek te verruimen, zodat grotere bouwbedrijven zelf monteurs kunnen opleiden binnen hun organisatie. Drie grote bouwers experimenteren al met eigen interne installatie-academies als structurele oplossing voor de langere termijn.",
      is_hero: false,
      bronnen: [{ naam: "Bouwend Nederland", url: "https://www.bouwendnederland.nl", type: "brancheorg", datum_publicatie: "2026-03-28" }],
      woorden: 262,
    },
    {
      id: "2026-W14-12",
      categorie: "Adviesbureaus",
      titel: "Tauw publiceert routekaart voor ZLT-implementatie in middelgrote gemeenten",
      lead: "Adviesbureau Tauw heeft een praktische routekaart gepubliceerd waarmee middelgrote gemeenten stap voor stap kunnen bepalen hoe ZLT-warmtenetten in hun warmtetransitievisie passen en welke randvoorwaarden daarvoor nodig zijn.",
      body: "De routekaart van Tauw richt zich specifiek op gemeenten met 50.000 tot 150.000 inwoners — een segment dat tot nu toe relatief weinig specifieke handreiking heeft gekregen. Grote steden als Amsterdam en Utrecht hebben eigen expertisecentra voor warmtetransitie, maar middelgrote gemeenten beschikken vaak niet over de ambtelijke capaciteit of het technisch kennisniveau om een ZLT-traject zelfstandig te doorlopen. De routekaart biedt een gestructureerd antwoord op die behoefte.\n\nDe routekaart bestaat uit vijf fasen: oriëntatie en warmtebronneninventarisatie, wijkselectie op basis van technische en financiële haalbaarheid, stakeholderproces en bewonersparticipatie, bestuurlijke besluitvorming en aanbesteding, en tot slot technische uitvoering en beheer. Elke fase bevat concrete werkpakketten, inclusief standaard contractbepalingen, kwaliteitscriteria voor de selectie van een warmtebedrijf en communicatiesjablonen voor de participatieaanpak.\n\nEen belangrijk onderdeel van de routekaart is de financiële toetsing. Tauw heeft voor drie representatieve wijktypen — een jaren-50-wijk, een portiekflat-complex en een recente nieuwbouwwijk — de businesscase voor ZLT doorgerekend. De conclusie is dat ZLT in alle drie de gevallen financieel haalbaar is, mits de gemeente bereid is de grondkosten voor de leidinginfrastructuur te subsidiëren of als onderdeel van de grondexploitatie op te nemen.\n\nDe routekaart is gratis beschikbaar via de website van Tauw en werd al door veertien gemeenten aangevraagd in de eerste week na publicatie. Tauw biedt aanvullend een begeleide workshopserie aan voor ambtelijke teams die de routekaart willen toepassen op hun eigen gemeente.",
      is_hero: false,
      bronnen: [{ naam: "Tauw", url: "https://www.tauw.nl", type: "adviesbureau", datum_publicatie: "2026-03-25" }],
      woorden: 263,
    },
    {
      id: "2026-W14-13",
      categorie: "Beleid & regelgeving",
      titel: "ACM publiceert definitieve tariefmethodiek voor gereguleerde warmtenetten",
      lead: "De Autoriteit Consument & Markt heeft de definitieve tariefmethodiek gepubliceerd voor warmtebedrijven die vallen onder de Wet collectieve warmtevoorziening. De methode bepaalt hoe warmtetarieven worden berekend en gecontroleerd.",
      body: "Met de publicatie van de definitieve tariefmethodiek geeft de ACM invulling aan een van de kernbepalingen van de Wet collectieve warmtevoorziening (Wcw). De methodiek regelt hoe warmtebedrijven hun tarieven voor eindgebruikers mogen berekenen, op welke manier rendementen worden bepaald, en hoe de ACM toezicht houdt op de naleving.\n\nDe methode werkt met een toegestaan rendement op het geïnvesteerd vermogen (WACC), dat voor de eerste reguleringsperiode 2026–2029 is vastgesteld op 5,2% na belasting. Dat ligt lager dan de 6,8% die sommige warmtebedrijven hadden gepleit in de consultatieronde, maar hoger dan het oorspronkelijke voorstel van de ACM van 4,7%. De uiteindelijke vaststelling weerspiegelt een afweging tussen investeringsprikkel en consumentenbescherming.\n\nDaarnaast introduceert de methodiek een efficiëntiekorting: warmtebedrijven moeten jaarlijks 1,5% efficiëntiewinst realiseren, vergelijkbaar met de X-factor die ook in de elektriciteits- en gastarievenregulering wordt toegepast. Bedrijven die meer dan de afgesproken efficiëntiewinst boeken, mogen het surplus tot een bepaald maximum behouden als extra rendement.\n\nDe warmtesector reageert verdeeld. Vattenfall Warmte en Eneco Warmte stellen dat de methodiek voldoende zekerheid biedt voor nieuwe investeringen. Kleinere warmtebedrijven en gemeentelijke warmtebedrijven wijzen er echter op dat de administratieve lasten van de nieuwe rapportageverplichtingen onevenredig zwaar drukken op hun beperkte organisatiecapaciteit. De ACM heeft toegezegd vereenvoudigde rapportageformulieren te ontwikkelen voor bedrijven onder een bepaalde omvangsdrempel.",
      is_hero: false,
      bronnen: [{ naam: "ACM", url: "https://www.acm.nl", type: "toezichthouder", datum_publicatie: "2026-03-31" }],
      woorden: 264,
    },
    {
      id: "2026-W14-14",
      categorie: "Markt & business",
      titel: "Investeringen in warmte-infrastructuur bereiken record van 1,3 miljard euro",
      lead: "Het totale investeringsvolume in warmtenetten, WKO-systemen en collectieve warmte-infrastructuur in Nederland heeft in 2025 voor het eerst de grens van 1,3 miljard euro overschreden. Dat is een stijging van 34% ten opzichte van 2024.",
      body: "Onderzoeksbureau Ecorys heeft in opdracht van het ministerie van Klimaat en Energie het jaarlijkse investeringsoverzicht voor de warmtesector gepubliceerd. Het totale investeringsvolume in 2025 komt uit op 1,32 miljard euro — een stijging van 34% ten opzichte van de 985 miljoen euro in 2024. Daarmee overschrijdt de sector voor het eerst de symbolische grens van één miljard euro, een mijlpaal die de branche al enkele jaren in het vooruitzicht stelde.\n\nDe grootste groeicategorie is de aanleg van nieuwe warmtenetinfrastructuur: pijpleidingen, onderstations en pompstations. Dit segment vertegenwoordigt 620 miljoen euro van het totaal. WKO-investeringen volgen met 380 miljoen euro. Restwarmteprojecten — waarbij warmte afkomstig van industrie of datacentra wordt benut — groeien het snelst in procentuele termen: van 58 naar 142 miljoen euro, een stijging van 145%.\n\nQua financieringsstructuur valt op dat het aandeel private investeringen toeneemt. Was in 2022 nog meer dan 60% van de warmte-investeringen afkomstig van publieke of semipublieke partijen, in 2025 is dat aandeel teruggelopen tot 41%. Institutionele beleggers — pensioenfondsen en infrastructuurfondsen — nemen een steeds groter deel van de financiering voor hun rekening, aangetrokken door de stabiele, gereguleerde kasstromen die warmtenetten genereren.\n\nEcorys stelt dat het investeringsvolume de komende jaren verder moet groeien naar 2,5 tot 3 miljard euro per jaar om de klimaatdoelstellingen voor de gebouwde omgeving te halen. Dat vereist niet alleen meer kapitaal, maar ook meer capaciteit in de keten van engineering en uitvoering.",
      is_hero: false,
      bronnen: [{ naam: "Ecorys / Min. Klimaat & Energie", url: "https://www.ecorys.com", type: "onderzoeksbureau", datum_publicatie: "2026-03-26" }],
      woorden: 267,
    },
    {
      id: "2026-W14-15",
      categorie: "Projecten & praktijk",
      titel: "Warmtenet Lewenborg bewijst levensvatbaarheid in Groningse krimpregio",
      lead: "Het warmtenet in de Groningse wijk Lewenborg toont aan dat collectieve warmtelevering ook in een krimpregio financieel haalbaar en technisch betrouwbaar kan zijn. De eerste prestatiemetingen zijn positiever dan verwacht.",
      body: "Lewenborg is geen voor de hand liggende locatie voor een warmtenetproject. De wijk in het zuidoosten van Groningen telt ruim 6.000 woningen, heeft te maken met een geleidelijke bevolkingsdaling, een hoog aandeel sociale huurwoningen en relatief lage WOZ-waarden. Juist omdat de businesscase moeilijker is dan in groeigebieden, is het project een interessante proeftuin voor de rest van Nederland.\n\nHet warmtenet in Lewenborg is gebaseerd op een combinatie van geothermie en grote WKO-systemen onder het naastgelegen bedrijventerrein. De warmtebron levert water van 18 tot 22°C, dat via een ZLT-distributiesysteem naar de woningen wordt getransporteerd. Individuele warmtepompen per woning onttrekken de benodigde warmte en leveren indien gewenst ook koeling in de zomer.\n\nHet project is een samenwerkingsverband van woningcorporatie Nijestee, gemeente Groningen en een private warmteleverancier. De investeringskosten worden deels gedekt door een bijdrage uit het Nationaal Groeifonds en de Stimuleringsregeling Aardgasvrije Wijken.\n\nNa anderhalf jaar operatie zijn de eerste prestatiemetingen beschikbaar. Het systeem behaalt een jaar-COP van 3,9 — beter dan de ontwerpraming van 3,5. De warmtelevering had een beschikbaarheid van 99,2% in het eerste jaar. Bewoners rapporteren een gemiddelde tevredenheid van 7,4 op een schaal van tien. De maandelijkse warmterekening is voor 78% van de bewoners lager dan voorheen met aardgas, met een gemiddelde besparing van 34 euro per maand.",
      is_hero: false,
      bronnen: [{ naam: "Nijestee / Gemeente Groningen", url: "https://www.nijestee.nl", type: "project", datum_publicatie: "2026-03-29" }],
      woorden: 261,
    },
    {
      id: "2026-W14-16",
      categorie: "Spotlight",
      titel: "Drie parallelle haalbaarheidsstudies voor ZLT in regio Utrecht",
      lead: "In de regio Utrecht lopen drie parallelle verkenningen naar ZLT-warmtenetten. De trajecten richten zich op verschillende warmtebronnen en wijktypen.",
      body: "Drie nieuwe haalbaarheidsstudies laten zien dat middelgrote gemeenten in de regio Utrecht serieus kijken naar collectieve warmteoplossingen met zeer lage temperatuur. De trajecten in Houten, Nieuwegein en Woerden verschillen inhoudelijk sterk, maar hebben gemeen dat ze zowel de technische haalbaarheid als de bestuurlijke en maatschappelijke randvoorwaarden in kaart brengen.\n\nIn Houten wordt gekeken naar een combinatie van restwarmte en WKO, in Nieuwegein naar de potentie van een geothermische bron en in Woerden naar een aquiferoplossing die past bij de lokale ondergrond. In alle drie de gevallen worden warmtevraag, infrastructuurkosten, stakeholderdynamiek en bewonersimpact meegenomen in de analyse.\n\nDe uitkomsten van deze studies moeten duidelijk maken welke projecten kansrijk genoeg zijn om door te gaan naar de volgende fase. Daarmee bieden ze ook leerpunten voor andere gemeenten die hun warmtetransitie concreter willen maken.",
      is_hero: false,
      bronnen: [{ naam: "Regionale projectverkenning", url: "https://www.utrecht.nl", type: "extern", datum_publicatie: "2026-04-01" }],
      woorden: 265,
    },
  ],
  agenda: [
    { datum: "2026-04-10", naam: "ZLT Kennisdag 2026", locatie: "Utrecht", url: "#" },
    { datum: "2026-04-15", naam: "Webinar Wcw — wat betekent dit voor gemeenten?", locatie: "Online", url: "#" },
    { datum: "2026-04-22", naam: "PAW Proeftuinen Bezoekdag", locatie: "Almere", url: "#" },
  ],
  spotlight: {
    titel: "Nieuwe regionale verkenningen naar ZLT",
    body: "In de regio Utrecht lopen meerdere nieuwe verkenningen naar ZLT-oplossingen. Meer achtergrond volgt in een komende editie.",
  },
  statistieken: {
    aantal_artikelen: 16,
    aantal_bronnen: 16,
    aantal_categorieen: 14,
    categorieen_overgeslagen: [],
  },
  status: "gepubliceerd",
};

// ─── DWM Logo SVG ─────────────────────────────────────────────────────────────

function DwmLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* Achtergrond */}
      <rect width="40" height="40" rx="6" fill="#18475D"/>
      {/* Verticale as */}
      <rect x="19.5" y="7" width="1.5" height="26" rx="0.75" fill="rgba(255,255,255,0.9)"/>
      {/* Horizontale balk */}
      <rect x="8" y="13.5" width="24" height="1.5" rx="0.75" fill="rgba(255,255,255,0.9)"/>
      {/* Linker schaal (warmte — oranje vlammetje) */}
      <circle cx="12" cy="22" r="4" fill="rgba(228,93,80,0.25)" stroke="#E45D50" strokeWidth="1.2"/>
      <path d="M12 25 C10.5 23 11 21 12 20 C12.5 21.5 13 22 13 23.5 C13 24.3 12.6 25 12 25Z" fill="#E45D50"/>
      {/* Rechter schaal (stroom — bliksem) */}
      <circle cx="28" cy="22" r="4" fill="rgba(99,179,237,0.18)" stroke="#63B3ED" strokeWidth="1.2"/>
      <path d="M29 19 L27 22.5 L28.5 22.5 L27 26 L30 21.5 L28.5 21.5 Z" fill="#63B3ED"/>
      {/* Balansdriehoek onderkant */}
      <path d="M18 33 L20.75 28 L23.5 33 Z" fill="rgba(255,255,255,0.5)"/>
    </svg>
  );
}

// ─── NavBar ───────────────────────────────────────────────────────────────────

function NavBar({ view, setView, editie }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const items = [["week","Deze week"],["bibliotheek","Bibliotheek"],["bronnen","Bronnen"]];

  function navigeer(v) { setView(v); setMenuOpen(false); }

  const edLabel = editie
    ? `Weekblad jaargang ${editie.jaar - 2025} — week ${editie.weeknummer} ${editie.jaar}`
    : null;

  return (
    <nav className="nav">
      {edLabel && <span className="nav__editie-info">{edLabel}</span>}
      {/* Desktop links */}
      <div className="nav__links nav__links--desktop">
        {items.map(([v,l]) => (
          <button key={v} className={`nav__link ${view === v ? "nav__link--actief" : ""}`} onClick={() => navigeer(v)}>{l}</button>
        ))}
      </div>

      {/* Hamburger knop mobiel */}
      <button className="nav__hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
        <span className={`nav__hamburger-lijn ${menuOpen ? "nav__hamburger-lijn--open" : ""}`} />
        <span className={`nav__hamburger-lijn ${menuOpen ? "nav__hamburger-lijn--open" : ""}`} />
        <span className={`nav__hamburger-lijn ${menuOpen ? "nav__hamburger-lijn--open" : ""}`} />
      </button>

      {/* Mobiel dropdown */}
      {menuOpen && (
        <div className="nav__dropdown">
          {items.map(([v,l]) => (
            <button key={v} className={`nav__dropdown-item ${view === v ? "nav__dropdown-item--actief" : ""}`} onClick={() => navigeer(v)}>{l}</button>
          ))}
        </div>
      )}
    </nav>
  );
}

// ─── Highlights Balk ─────────────────────────────────────────────────────────

function HighlightsBalk({ highlights }) {
  if (!highlights?.length) return null;
  const dubbel = [...highlights, ...highlights];
  return (
    <div className="ticker">
      <div className="ticker__label">
        <span className="ticker__dot" />
        Nieuws
      </div>
      <div className="ticker__outer">
        <div className="ticker__track">
          {dubbel.map((h, i) => (
            <span key={i} className="ticker__item">{h}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Masthead ────────────────────────────────────────────────────────────────

function Masthead({ editie, alleEdities, onVorige, onVolgende }) {
  const gesorteerd = [...alleEdities].sort();
  const idx = gesorteerd.indexOf(editie.editie);
  const heeftVorige   = idx > 0;
  const heeftVolgende = idx < gesorteerd.length - 1;

  return (
    <header className="masthead">
      <div className="masthead__nav-week">
        <button className="masthead__week-pijl" disabled={!heeftVorige} onClick={onVorige}>
          ← Week {editie.weeknummer - 1}
        </button>
        <div style={{ flex: 1 }} />
        <button className="masthead__week-pijl" disabled={!heeftVolgende} onClick={onVolgende}>
          Week {editie.weeknummer + 1} →
        </button>
      </div>

      <div className="masthead__logo-wrap">
        <DwmLogo size={72} />
      </div>

      {/* Dubbele lijn */}
      <div className="masthead__regel">
        <div className="masthead__lijn masthead__lijn--dik" />
        <span className="masthead__ruit">◆</span>
        <div className="masthead__lijn masthead__lijn--dik" />
      </div>

      <div className="masthead__brand">De Energiebalans</div>
      <div className="masthead__sub">Collectief verduurzamen van elektriciteit en warmte, sturen op balans</div>

    </header>
  );
}

// ─── Categorie Filter Balk ───────────────────────────────────────────────────

function FilterBalk({ categorieën, actief, onChange }) {
  return (
    <div className="filter-balk">
      <div className="filter-balk__inner">
        <button
          className={`filter-chip ${actief === null ? "filter-chip--actief" : ""}`}
          style={actief === null ? { "--cat-kleur": "#18475D" } : {}}
          onClick={() => onChange(null)}
        >
          Alle
        </button>
        {categorieën.map(cat => (
          <button
            key={cat}
            className={`filter-chip ${actief === cat ? "filter-chip--actief" : ""}`}
            style={{ "--cat-kleur": catKleur(cat) }}
            onClick={() => onChange(actief === cat ? null : cat)}
          >
            <span className="filter-chip__dot" />
            {catLabel(cat)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Artikel Lijst Item ───────────────────────────────────────────────────────

function ArtikelLijstItem({ artikel, actief, onClick }) {
  const kleur = catKleur(artikel.categorie);
  const { src, onError } = imgProps(artikel);
  return (
    <button
      className={`lijst-item ${actief ? "lijst-item--actief" : ""} ${artikel.is_redactioneel ? "lijst-item--redactioneel" : ""}`}
      style={{ "--cat-kleur": kleur }}
      onClick={() => onClick(artikel)}
    >
      <div className="lijst-item__accent" />
      <div className="lijst-item__body">
        <span className="lijst-item__cat">{catLabel(artikel.categorie)}</span>
        <span className="lijst-item__titel">{stripKop(artikel.titel)}</span>
        {artikel.bronnen?.[0]?.datum_publicatie && (
          <span className="lijst-item__datum">
            {formatDatum(artikel.bronnen[0].datum_publicatie, "kort")}
          </span>
        )}
      </div>
      <div className="lijst-item__thumb">
        <img src={src} alt="" loading="lazy" onError={onError} />
      </div>
    </button>
  );
}

// ─── Artikel Leesvenster ─────────────────────────────────────────────────────

const REDENEN = [
  "Niet relevant voor mij",
  "Te technisch",
  "Al bekend",
  "Te oppervlakkig",
  "Onduidelijk geschreven",
  "Anders",
];

function ArtikelFeedback({ artikelId, editieId }) {
  const PRE = "dwm_fb_";
  const bestaand = localStorage.getItem(`${PRE}${artikelId}`);
  const [fase, setFase] = useState(bestaand ? "klaar" : "vraag"); // vraag | redenen | klaar
  const [gekozenReden, setGekozenReden] = useState(null);

  async function stuurFeedback(waarde, reden) {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artikel_id: artikelId,
          editie_id: editieId,
          device_id: Analytics._deviceId(),
          waarde,
          reden: reden || null,
        }),
      });
    } catch {}
    localStorage.setItem(`${PRE}${artikelId}`, waarde ? "ja" : "nee");
    setFase("klaar");
  }

  async function kiesReden(reden) {
    setGekozenReden(reden);
    await stuurFeedback(false, reden.toLowerCase());
  }

  if (fase === "klaar") {
    return (
      <div className="artikel-feedback">
        <div className="artikel-feedback__bevestiging">
          Bedankt voor je feedback!
        </div>
      </div>
    );
  }

  if (fase === "redenen") {
    return (
      <div className="artikel-feedback artikel-feedback--redenen">
        <span className="artikel-feedback__vraag">Waarom niet?</span>
        <div className="artikel-feedback__redenen">
          {REDENEN.map(r => (
            <button
              key={r}
              className={`artikel-feedback__reden-btn${gekozenReden === r ? " artikel-feedback__reden-btn--actief" : ""}`}
              onClick={() => kiesReden(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="artikel-feedback">
      <span className="artikel-feedback__vraag">Nuttig?</span>
      <button className="artikel-feedback__btn artikel-feedback__btn--ja" onClick={() => stuurFeedback(true, null)}>Ja</button>
      <button className="artikel-feedback__btn artikel-feedback__btn--nee" onClick={() => setFase("redenen")}>Nee</button>
    </div>
  );
}

function ArtikelLeesvenster({ artikel, editieId }) {
  const kleur = catKleur(artikel.categorie);
  const { src, onError } = imgProps(artikel);
  const leestijd = Math.ceil((artikel.woorden || 200) / 200);
  const alineas = (artikel.body || "").split("\n\n").filter(Boolean);
  const directeBron = artikel.bronnen?.find(b => b?.url) || null;
  const openTijd = useRef(Date.now());

  useEffect(() => {
    Analytics.artikelOpen(artikel.id, editieId);
    openTijd.current = Date.now();
    return () => {
      const seconden = (Date.now() - openTijd.current) / 1000;
      Analytics.leestijd(artikel.id, editieId, seconden);
    };
  }, [artikel.id]);

  return (
    <div className="leesvenster">

      {/* Hero afbeelding */}
      <div className="leesvenster__hero">
        <img
          className="leesvenster__hero-img"
          src={src}
          alt={artikel.titel}
          loading="eager"
          onError={onError}
        />
        <div className="leesvenster__hero-gradient" />
      </div>

      {/* Leeskolom */}
      <div className="leesvenster__inhoud">

        {/* Meta */}
        <div className="leesvenster__meta">
          <span className="leesvenster__cat-tag" style={{ background: kleur }}>
            {catLabel(artikel.categorie)}
          </span>
          {artikel.bronnen?.[0]?.datum_publicatie && (
            <span className="leesvenster__meta-datum">
              {formatDatum(artikel.bronnen[0].datum_publicatie, "lang")}
            </span>
          )}
          <span className="leesvenster__meta-sep">·</span>
          <span className="leesvenster__meta-leestijd">{leestijd} min leestijd</span>
          {artikel.bronnen?.[0]?.naam && (
            <>
              <span className="leesvenster__meta-sep">·</span>
              <span className="leesvenster__meta-bron">{artikel.bronnen[0].naam}</span>
            </>
          )}
        </div>

        {/* Titel */}
        <h1 className="leesvenster__titel">{stripKop(artikel.titel)}</h1>

        {/* Lead */}
        <p className="leesvenster__lead">{artikel.lead}</p>

        {/* Feedback */}
        <ArtikelFeedback artikelId={artikel.id} editieId={editieId} />

        {/* Accentlijn in categoriekleur */}
        <div className="leesvenster__lijn" style={{ "--cat-kleur": kleur }} />

        {/* Body tekst */}
        {alineas.length > 0 ? (
          <div className="leesvenster__body">
            {alineas.map((alinea, i) => (
              <p
                key={i}
                className={`leesvenster__alinea${i === 0 ? " leesvenster__alinea--eerste" : ""}`}
              >
                {alinea}
              </p>
            ))}
          </div>
        ) : (
          <p className="leesvenster__geen-body">
            De volledige artikeltekst wordt geladen zodra de agent draait.
          </p>
        )}

        {/* Bronnen */}
        {artikel.bronnen?.length > 0 && (
          <div className="leesvenster__bronnen-blok">
            <div className="leesvenster__bronnen-titel">Bronnen</div>
            {artikel.bronnen.map((b, i) => (
              <div key={i} className="leesvenster__bron-item">
                <a
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="leesvenster__bron-link"
                >
                  {b.naam}
                </a>
                {b.type && <span className="leesvenster__bron-type">{b.type}</span>}
                {b.datum_publicatie && (
                  <span className="leesvenster__bron-datum">
                    {formatDatum(b.datum_publicatie, "lang")}
                  </span>
                )}
              </div>
            ))}
            <p className="leesvenster__disclaimer">
              Dit artikel is een redactionele samenvatting van extern bronmateriaal.
              Alle beweringen zijn gebaseerd op de vermelde bronnen — controleer de originele publicatie voor volledige context.
            </p>
          </div>
        )}

        {directeBron && (
          <div className="leesvenster__directe-bron">
            <div className="leesvenster__bronnen-titel">Directe bron</div>
            <a
              href={directeBron.url}
              target="_blank"
              rel="noopener noreferrer"
              className="leesvenster__directe-bron-link"
            >
              Open originele artikel →
            </a>
            <div className="leesvenster__directe-bron-url">{directeBron.url}</div>
          </div>
        )}

      </div>
    </div>
  );
}

// ─── Agenda & Spotlight ───────────────────────────────────────────────────────

function AgendaSpotlight({ agenda, spotlight }) {
  if (!agenda?.length && !spotlight) return null;
  return (
    <div className="agenda-spotlight">
      {agenda?.length > 0 && (
        <div className="agenda">
          <div className="sectie-label">Agenda</div>
          <ul className="agenda__lijst">
            {agenda.map((item, i) => (
              <li key={i} className="agenda__item">
                <span className="agenda__datum">{formatDatum(item.datum, "kort")}</span>
                <div>
                  <div className="agenda__naam">
                    {item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer">{item.naam}</a> : item.naam}
                  </div>
                  {item.locatie && <div className="agenda__locatie">{item.locatie}</div>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {spotlight && (
        <div className="spotlight">
          <div className="spotlight__label">Spotlight</div>
          <h3 className="spotlight__titel">{spotlight.titel}</h3>
          <p className="spotlight__body">{spotlight.body}</p>
        </div>
      )}
    </div>
  );
}

// ─── Week Footer ──────────────────────────────────────────────────────────────

function WeekFooter({ editie }) {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__top">
          <div>
            <div className="footer__naam">De Energiebalans</div>
            <div className="footer__tagline">Collectief verduurzamen van elektriciteit en warmte, sturen op balans</div>
          </div>
        </div>
        <div className="footer__bottom">
          <p className="footer__disclaimer">
            Alle artikelen zijn redactionele samenvattingen van extern bronmateriaal.
            Originele bronnen zijn vermeld bij elk artikel.
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Week Pagina ──────────────────────────────────────────────────────────────

function WeekPagina({ editie, alleEdities, onNavigeer }) {
  const gesorteerd = [...alleEdities].sort();
  const idx = gesorteerd.indexOf(editie.editie);

  const artikelen = editie.artikelen || [];
  const held = artikelen.find(a => a.is_redactioneel) || artikelen.find(a => a.is_hero) || artikelen[0] || null;
  const [actief, setActief] = useState(held);
  // Mobiel: "lijst" of "artikel"
  const [mobieltab, setMobieltab] = useState("lijst");
  // Suggestie-veld
  const [suggestieTekst, setSuggestieTekst] = useState("");
  const [suggestieStatus, setSuggestieStatus] = useState(null); // null | "ok" | "err"

  async function stuurSuggestie(e) {
    e.preventDefault();
    const tekst = suggestieTekst.trim();
    if (tekst.length < 3) return;
    try {
      const res = await fetch("/api/suggestie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: Analytics._deviceId(), tekst }),
      });
      setSuggestieStatus(res.ok ? "ok" : "err");
      if (res.ok) setSuggestieTekst("");
    } catch { setSuggestieStatus("err"); }
    setTimeout(() => setSuggestieStatus(null), 4000);
  }

  useEffect(() => {
    const nieuwHeld = (editie.artikelen || []).find(a => a.is_redactioneel) || (editie.artikelen || []).find(a => a.is_hero) || editie.artikelen?.[0] || null;
    setActief(nieuwHeld);
    setMobieltab("lijst");
  }, [editie.editie]);

  function kiesArtikel(a) {
    setActief(a);
    setMobieltab("artikel");
  }

  return (
    <>
      <Masthead
        editie={editie}
        alleEdities={alleEdities}
        onVorige={() => onNavigeer(gesorteerd[idx - 1])}
        onVolgende={() => onNavigeer(gesorteerd[idx + 1])}
      />

      <HighlightsBalk highlights={editie.highlights} />

      {/* Mobiele tab-balk */}
      <div className="mobiel-tabs">
        <button
          className={`mobiel-tab ${mobieltab === "lijst" ? "mobiel-tab--actief" : ""}`}
          onClick={() => setMobieltab("lijst")}
        >
          Artikelen ({artikelen.length})
        </button>
        <button
          className={`mobiel-tab ${mobieltab === "artikel" ? "mobiel-tab--actief" : ""}`}
          onClick={() => setMobieltab("artikel")}
          disabled={!actief}
        >
          Lees artikel
        </button>
      </div>

      <div className="week-split">

        {/* Links: gescrold artikel lijst */}
        <aside className={`week-split__lijst ${mobieltab === "artikel" ? "week-split__lijst--verborgen" : ""}`}>
          <div className="lijst-meedoen">
            <p className="lijst-meedoen__tekst">
              Help ons het weekblad beter te maken, laat bij elk artikel weten of het nuttig voor je was. Mis je een onderwerp? Geef het hier door:
            </p>
            <form className="lijst-meedoen__form" onSubmit={stuurSuggestie}>
              <input
                className="lijst-meedoen__input"
                type="text"
                placeholder="Onderwerp dat je mist…"
                maxLength={500}
                value={suggestieTekst}
                onChange={e => setSuggestieTekst(e.target.value)}
              />
              <button
                className={`lijst-meedoen__btn${suggestieTekst.trim().length > 0 ? " lijst-meedoen__btn--zichtbaar" : ""}`}
                type="submit"
                aria-label="Verstuur onderwerp"
              >↑</button>
            </form>
            {suggestieStatus === "ok" && (
              <p className="lijst-meedoen__feedback lijst-meedoen__feedback--ok">Bedankt!</p>
            )}
            {suggestieStatus === "err" && (
              <p className="lijst-meedoen__feedback lijst-meedoen__feedback--err">Kon niet opslaan, probeer opnieuw.</p>
            )}
          </div>
          {artikelen.map(a => (
            <ArtikelLijstItem
              key={a.id || a.titel}
              artikel={a}
              actief={actief?.id === a.id || actief?.titel === a.titel}
              onClick={kiesArtikel}
            />
          ))}
        </aside>

        {/* Rechts: leesvenster */}
        <main className={`week-split__venster ${mobieltab === "lijst" ? "week-split__venster--verborgen" : ""}`}>
          {actief
            ? <ArtikelLeesvenster artikel={actief} editieId={editie.editie} />
            : <div className="leeg" style={{ padding: "64px 32px" }}>
                <p className="leeg__kop">Selecteer een artikel</p>
              </div>
          }
        </main>

      </div>

      <WeekFooter editie={editie} />
    </>
  );
}

// ─── Bibliotheek Pagina ───────────────────────────────────────────────────────

function BibliotheekPagina({ alleEdities, onNavigeer }) {
  const [zoek, setZoek] = useState("");
  const [jaar, setJaar] = useState("alle");

  const edities = alleEdities
    .map(id => laadEditie(id))
    .filter(Boolean)
    .sort((a, b) => b.editie.localeCompare(a.editie));

  const jaren = [...new Set(edities.map(e => e.jaar))].sort().reverse();

  const gefilterd = edities.filter(e => {
    const matchJaar = jaar === "alle" || e.jaar === parseInt(jaar);
    const matchZoek = !zoek ||
      (e.highlights || []).some(h => h.toLowerCase().includes(zoek.toLowerCase())) ||
      (e.artikelen || []).some(a => a.titel?.toLowerCase().includes(zoek.toLowerCase()));
    return matchJaar && matchZoek;
  });

  return (
    <div className="pagina">
      <h1 className="pagina__titel">Bibliotheek</h1>
      <p className="pagina__sub">Alle edities van De Energiebalans</p>

      <div className="bibliotheek__filters">
        <select className="input-select" value={jaar} onChange={e => setJaar(e.target.value)}>
          <option value="alle">Alle jaren</option>
          {jaren.map(j => <option key={j} value={j}>{j}</option>)}
        </select>
        <input
          className="input-zoek"
          placeholder="Zoek in edities, artikelen..."
          value={zoek}
          onChange={e => setZoek(e.target.value)}
        />
      </div>

      {gefilterd.length === 0 && (
        <div className="leeg">
          <p className="leeg__kop">Geen edities gevonden</p>
          <p>Pas de filters aan of voer de agent uit voor de eerste editie.</p>
        </div>
      )}

      {gefilterd.map(e => (
        <div key={e.editie} className="editie-kaart">
          <div>
            <div className="editie-kaart__week">Week</div>
            <div className="editie-kaart__nr">{e.weeknummer}</div>
            <div className="editie-kaart__periode">{weekPeriode(e.datum_start, e.datum_eind)}</div>
          </div>
          <ul className="editie-kaart__highlights">
            {(e.highlights || []).slice(0, 3).map((h, i) => (
              <li key={i} className="editie-kaart__highlight">{h}</li>
            ))}
          </ul>
          <button className="lees-btn" onClick={() => onNavigeer(e.editie)}>Lees →</button>
        </div>
      ))}
    </div>
  );
}

// ─── Bronnen Pagina ───────────────────────────────────────────────────────────

function BronnenPagina() {
  const [zoek,       setZoek]       = useState("");
  const [categorie,  setCategorie]  = useState("alle");
  const [bronnen,    setBronnen]    = useState(null); // null = laden
  const [fout,       setFout]       = useState(null);

  useEffect(() => {
    fetch("data/bronnen/bronindex.json", { cache: "no-store" })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => setBronnen(Array.isArray(d.bronnen) ? d.bronnen : []))
      .catch(e => {
        // Fallback: bouw uit localStorage als het JSON-bestand er nog niet is
        const uit_ls = [];
        const gezien = new Set();
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k?.startsWith("dwm:editie:")) continue;
          try {
            const editie = JSON.parse(localStorage.getItem(k) || "{}");
            (editie.artikelen || []).forEach(a => {
              (a.bronnen || []).forEach(b => {
                if (!gezien.has(b.url)) {
                  uit_ls.push({ ...b, artikel_titel: a.titel, categorie: a.categorie, weeknummer: editie.weeknummer, jaar: editie.jaar, editie_id: editie.editie, edities: [editie.editie] });
                  gezien.add(b.url);
                }
              });
            });
          } catch {}
        }
        setBronnen(uit_ls);
        if (uit_ls.length === 0) setFout("Bronindex nog niet beschikbaar. Voer de agent uit.");
      });
  }, []);

  const alleCategorieën = bronnen
    ? [...new Set(bronnen.map(b => b.categorie).filter(Boolean))].sort()
    : [];

  const gefilterd = (bronnen || []).filter(b => {
    const zoekMatch = !zoek || [b.naam, b.artikel_titel, b.url].some(
      v => v?.toLowerCase().includes(zoek.toLowerCase())
    );
    const catMatch = categorie === "alle" || b.categorie === categorie;
    return zoekMatch && catMatch;
  });

  return (
    <div className="pagina">
      <h1 className="pagina__titel">Bronnenbibliotheek</h1>
      <p className="pagina__sub">
        {bronnen === null
          ? "Laden..."
          : `${bronnen.length} unieke bronnen — groeit elke week`}
      </p>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
        <input
          className="input-zoek"
          placeholder="Zoek op bronnaam, artikel of URL..."
          value={zoek}
          onChange={e => setZoek(e.target.value)}
          style={{ maxWidth: "360px" }}
        />
        <select
          className="input-zoek"
          value={categorie}
          onChange={e => setCategorie(e.target.value)}
          style={{ maxWidth: "220px" }}
        >
          <option value="alle">Alle categorieën</option>
          {alleCategorieën.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
        </select>
      </div>

      {fout && <p style={{ color: "var(--dwm-coral)", marginBottom: "16px" }}>{fout}</p>}

      {bronnen === null && <p style={{ color: "var(--ink-subtle)" }}>Bronnenindex laden...</p>}

      {bronnen !== null && (
        <table className="bronnen-tabel">
          <thead>
            <tr>
              <th>#</th>
              <th>Bron</th>
              <th>Categorie</th>
              <th>Artikel</th>
              <th>Edities</th>
              <th>Datum</th>
            </tr>
          </thead>
          <tbody>
            {gefilterd.map((b, i) => (
              <tr key={b.url || i}>
                <td style={{ color: "var(--ink-subtle)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>{i + 1}</td>
                <td>
                  <a href={b.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: "var(--dwm-navy)" }}>{b.naam || b.url}</a>
                  <div style={{ fontSize: "11px", color: "var(--ink-subtle)", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                    {b.url?.slice(0, 55)}
                  </div>
                </td>
                <td style={{ color: catKleur(b.categorie), fontWeight: 700, fontSize: "12px", fontFamily: "var(--font-ui)" }}>
                  {catLabel(b.categorie)}
                </td>
                <td style={{ fontSize: "13px", maxWidth: "220px", color: "var(--ink-medium)" }}>
                  {stripKop(b.artikel_titel)}
                </td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-subtle)", whiteSpace: "nowrap" }}>
                  {b.weeknummer
                    ? `W${b.weeknummer}`
                    : (b.edities || [b.editie_id]).filter(Boolean).map(e => `W${e?.split("-W")[1]}`).join(", ")}
                </td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--ink-subtle)", whiteSpace: "nowrap" }}>
                  {b.datum_publicatie ? formatDatum(b.datum_publicatie, "kort") : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {bronnen !== null && gefilterd.length === 0 && (
        <div className="leeg">
          <p className="leeg__kop">Geen bronnen gevonden</p>
        </div>
      )}
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

function App() {
  const [view, setView] = useState("week");
  const [actieveId, setActieveId] = useState(null);
  const [alleEdities, setAlleEdities] = useState([]);

  useEffect(() => {
    let geannuleerd = false;

    async function initialiseer() {
      try {
        const ids = await laadPubliekeEdities();
        if (geannuleerd) return;

        const actueel = getActueel();
        const gekozen = ids.includes(actueel) ? actueel : (ids[0] || null);
        if (gekozen) setActueel(gekozen);
        setAlleEdities(ids);
        setActieveId(gekozen);
      } catch (error) {
        console.error("Laden van publieke edities mislukt:", error);
        if (geannuleerd) return;

        const lijst = lijstEdities();
        setAlleEdities(lijst);
        setActieveId(getActueel() || lijst[0] || null);
      }
    }

    initialiseer();
    return () => { geannuleerd = true; };
  }, []);

  function navigeer(id) {
    setActieveId(id);
    setActueel(id);
    setView("week");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function wissel(v) {
    setView(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
    Analytics.pageview(v, v === "week" ? actieveId : null);
  }

  useEffect(() => {
    if (actieveId) Analytics.pageview("week", actieveId);
  }, [actieveId]);

  const editie = actieveId ? laadEditie(actieveId) : null;

  return (
    <>
      <NavBar view={view} setView={wissel} editie={editie} />

      {view === "week" && (
        editie
          ? <WeekPagina editie={editie} alleEdities={alleEdities} onNavigeer={navigeer} />
          : <div className="leeg" style={{ marginTop: "80px" }}>
              <p className="leeg__kop">Geen editie beschikbaar</p>
              <p>Voer de agent uit om de eerste weekbrief te genereren.</p>
            </div>
      )}

      {view === "bibliotheek" && (
        <BibliotheekPagina alleEdities={alleEdities} onNavigeer={navigeer} />
      )}

      {view === "bronnen" && (
        <BronnenPagina />
      )}
    </>
  );
}

// Mount
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
