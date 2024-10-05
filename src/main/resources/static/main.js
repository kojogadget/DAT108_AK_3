"use strict";

// Globale variabler
const app = document.getElementById("root");
const [registrering, resultater] = app.getElementsByTagName("fieldset");
const [regButton, resButton] = app.getElementsByTagName("button");
const [regMessage] = registrering.getElementsByTagName("p");
const [resBody] = resultater.getElementsByTagName("tbody");
const [ingenResultater] = resultater.getElementsByTagName("p");

/**
 * Dette er et object for å lagre dataen som registreres.
 * 
 * @class
 * @property {number} startnr - Startnummeret til deltageren. Må være et unikt nummer.
 * @property {string} navn - Deltagerens navn. Tillater bokstaver, mellomrom og bindestrek.
 * @property {string} sluttid - Sluttiden for deltageren, i text format HH:MM:SS.
 * @property {number} sekunder - Sluttiden for deltageren, i sekunder fra starten av løpet.
 * @property {number} plassering - Plasseringen til deltageren i forhold til indeksen i listen.
 */
class Deltager {
    /**
     * Oppretter en ny Deltager-instans.
     *
     * @param {number} startnr - Startnummeret til deltageren.
     * @param {string} navn - Navnet til deltageren.
     * @param {string} sluttid - Sluttiden i string med formatet HH:MM:SS.
     * @param {number} sekunder - Sluttiden konvertert fra sekunder.
     * @param {number} plassering - Plasseringen til deltageren basert på sluttiden.
     */
    constructor(startnr, navn, sluttid, sekunder, plassering = 0) {
        this.startnr = startnr;
        this.navn = navn;
        this.sluttid = sluttid;
        this.sekunder = sekunder;
        this.plassering = plassering;
    };
};
const deltagereMap = new Map();
const deltagere = [];

// Hjelpefunksjoner
/**
 * Validerer om et gitt inputfelt har en verdi, og viser en feilmelding hvis feltet er tomt.
 *
 * @param {HTMLInputElement} felt - Inputfeltet som skal valideres.
 * @param {string} feilmelding - Feilmelding som skal vises hvis feltet er tomt.
 * @returns {boolean} Returnerer true hvis feltet er gyldig, false hvis ikke.
 */
function validerInputFelt(felt, feilmelding) {
    felt.setCustomValidity("");
    felt.reportValidity();
    if (!felt.checkValidity()) {
        felt.setCustomValidity(feilmelding);
        felt.reportValidity();
        felt.focus();
        return false;
    };
    return true;
};

/**
 * Validerer om et startnummer allerede er registrert blant deltagerne.
 *
 * @param {HTMLInputElement} startnr - Inputfeltet som inneholder startnummeret som skal valideres.
 * @returns {boolean} Returnerer true hvis startnummeret er unikt, false hvis det allerede er registrert.
 */
function validerStartnummer(startnr) {
    startnr.setCustomValidity("");
    startnr.reportValidity();
    if (deltagereMap.has(startnr.value)) {
        startnr.setCustomValidity(`Startnummer ${startnr.value} er allerede registrert`);
        startnr.reportValidity();
        startnr.focus();
        return false;
    };
    return true;
}

/**
 * Formaterer et navn slik at første bokstav i hvert ord, samt første bokstav etter bindestreker, blir kapitalisert.
 *
 * @param {string} navn - Navnet som skal formateres.
 * @returns {string} Det formaterte navnet med korrekt kapitalisering.
 */
function formaterNavn(navn) {
    const navnReg = /(^|-|\s)(\p{Ll})/gu;
    navn.toLocaleLowerCase(navigator.language);

    return navn.replace(navnReg, 
        (_, symbol, tegn) => `${symbol}${tegn.toLocaleUpperCase(navigator.language)}`
    );
};

/**
 * Registrerer en ny deltager basert på startnummer, navn og sluttid.
 * Validerer at startnummeret er unikt og legger til deltageren i deltagerlisten.
 * Oppdaterer deltagerens plassering basert på sluttiden etter registrering.
 *
 * @param {HTMLInputElement} startnr - Inputfeltet som inneholder deltagerens startnummer.
 * @param {HTMLInputElement} navn - Inputfeltet som inneholder deltagerens navn.
 * @param {HTMLInputElement} sluttid - Inputfeltet som inneholder deltagerens sluttid i formatet HH:MM:SS.
 * @returns {boolean} Returnerer true hvis registreringen var vellykket, eller false hvis startnummeret allerede er registrert.
 */
function registrerDeltager(startnr, navn, sluttid) {
    if (!validerStartnummer(startnr)) return false;

    const deltager = new Deltager(startnr.value,
        formaterNavn(navn.value),
        sluttid.value,
        tidStringToSekunder(sluttid.value));

    deltagereMap.set(startnr.value, deltager)
    deltagere.push(deltager);
    deltagere.sort((a, b) => a.sekunder - b.sekunder)
            .forEach((element, indeks) => element.plassering = indeks + 1);

    return true;
};

/**
 * Oppdaterer registreringsmeldingen med deltagerens navn, startnummer og sluttid.
 *
 * @param {Deltager} deltager - En av deltagerne som er registrert.
 */
function oppdaterMeldinger(deltager) {
    const [navnMsg, startnrMsg, sluttidMsg] = regMessage.getElementsByTagName("span");
    navnMsg.innerText = deltager.navn;
    startnrMsg.innerText = deltager.startnr;
    sluttidMsg.innerText = deltager.sluttid;
    regMessage.className = "";
};

/**
 * Nullstiller verdiene i de oppgitte inputfeltene og setter fokus på det første feltet.
 *
 * @param {...HTMLInputElement} felter - En liste over inputfelter som skal nullstilles.
 */
function nullstillFelter(...felter) {
    felter.forEach(felt => felt.value = null);
    felter[0].focus();
};

/**
 * Konverterer en tidsstreng i formatet HH:MM:SS til antall sekunder.
 *
 * @param {string} tidString - Tidsstreng som skal konverteres, i formatet HH:MM:SS.
 * @returns {number|null} Antall sekunder representert av tidsstrengen, eller null hvis input er ugyldig.
 */
function tidStringToSekunder(tidString) {
    if (!tidString) return null;

    const deler = tidString.split(':');
    const timer = parseInt(deler[0], 10);
    const minutter = parseInt(deler[1], 10);
    const sekunder = parseInt(deler[2], 10);

    return timer * 3600 + minutter * 60 + sekunder;
};

/**
 * Filtrerer en liste av deltagere basert på et gitt tidsintervall.
 *
 * @param {number|null} fraTid - Starttid i sekunder for filtreringen. Hvis null, brukes kun sluttid.
 * @param {number|null} tilTid - Sluttid i sekunder for filtreringen. Hvis null, brukes kun starttid.
 * @param {Deltager[]} deltagere - En liste med deltagerobjekter som skal filtreres.
 * @returns {Deltager[]} En liste av deltagere hvis sluttid er innenfor det spesifiserte tidsintervallet.
 */
function velgDeltagere(fraTid, tilTid, deltagere) {
    if (!fraTid && !tilTid) return deltagere;
    if (!fraTid) return deltagere.filter(deltager => deltager.sekunder <= tilTid);
    if (!tilTid) return deltagere.filter(deltager => deltager.sekunder >= fraTid);
    return deltagere.filter((deltager) => deltager.sekunder >= fraTid)
                    .filter((deltager) => deltager.sekunder <= tilTid);
};

/**
 * Viser en liste av deltagere i en tabell. Hvis ingen deltagere finnes, vises en melding.
 *
 * Funksjonen oppdaterer et HTML-tabell-element med informasjon om hver deltager. Hvis listen er tom, vises en melding om at ingen resultater er tilgjengelige. Hver deltager får en rad med informasjon som startnummer, navn og sluttid. Tiden konverteres fra sekunder til formatet HH:MM:SS.
 *
 * @param {Deltager[]} deltagere - En liste av deltagerobjekter som skal vises.
 */
function visDeltagere(deltagere) {
    ingenResultater.classList.toggle("hidden", deltagere.length > 0);

    deltagere.forEach(deltager => {
        const rad = document.createElement("tr"); 

        const plassering = document.createElement("th"); 
        const startnr = document.createElement("th"); 
        const navn = document.createElement("th"); 
        const sluttid = document.createElement("th"); 
        plassering.innerText = deltager.plassering; 
        startnr.innerText = deltager.startnr;
        navn.innerText = deltager.navn;
        sluttid.innerText = deltager.sluttid;

        rad.appendChild(plassering);
        rad.appendChild(startnr);
        rad.appendChild(navn);
        rad.appendChild(sluttid);
        resBody.appendChild(rad);
    });
};

// Eventlyttere
/**
 * Håndterer klikkhendelsen for registreringsknappen.
 * Validerer input, legger til deltageren i deltagerlisten og oppdaterer meldinger.
 */
regButton.addEventListener("click", () => {
    const [startnr, navn, sluttid] = registrering.getElementsByTagName("input");

    if (!validerInputFelt(startnr, "Du må skrive et tall fra 1 og oppover")) return;
    if (!validerInputFelt(navn, "Tillate tegn er kun bokstaver og enkelt mellomrom eller bindestrek mellom navnene.")) return;
    if (!validerInputFelt(sluttid, "Følg formatet som kreves:)")) return;

    if (!registrerDeltager(startnr, navn, sluttid)) return;

    oppdaterMeldinger(deltagereMap.get(startnr.value));
    nullstillFelter(startnr, navn, sluttid);
});

/**
 * Håndterer klikkhendelsen for visningsknappen for resultater.
 * Filtrerer deltagere basert på tid og viser de som passer innenfor det angitte tidsintervallet.
 */
resButton.addEventListener("click", () => {
    resBody.innerHTML = "";
    const [fraTid, tilTid] = resultater.getElementsByTagName("input");
    const fraTidValue = tidStringToSekunder(fraTid.value);
    const tilTidValue = tidStringToSekunder(tilTid.value);
    if (tilTidValue && fraTidValue && tilTidValue < fraTidValue) {
        tilTid.focus();
        tilTid.setCustomValidity("Øvre grense må være større en nedrer");
        return tilTid.reportValidity(); 
    };
    tilTid.setCustomValidity("");
    tilTid.reportValidity();
    
    const onsketDeltagere = velgDeltagere(fraTidValue, tilTidValue, deltagere);

    visDeltagere(onsketDeltagere);
    nullstillFelter(fraTid, tilTid);
});
