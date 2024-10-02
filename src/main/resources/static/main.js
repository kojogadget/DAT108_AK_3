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
 * @property {number} sluttid - Sluttiden for deltageren, i sekunder fra starten av løpet.
 * @property {number} plassering - Plasseringen til deltageren i forhold til indeksen i listen.
 */
class Deltager {
    /**
     * Oppretter en ny Deltager-instans.
     *
     * @param {number} startnr - Startnummeret til deltageren.
     * @param {string} navn - Navnet til deltageren.
     * @param {number} sluttid - Sluttiden i sekunder (konvertert fra tid som HH:MM:SS).
     * @param {number} plassering - Plasseringen til deltageren basert på sluttiden.
     */
    constructor(startnr, navn, sluttid, plassering = 0) {
        this.startnr = startnr;
        this.navn = navn;
        this.sluttid = sluttid;
        this.plassering = plassering;
    };
};
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
    if (!felt.value) {
        felt.setCustomValidity(feilmelding);
        felt.reportValidity();
        felt.focus();
        return false;
    }
    felt.setCustomValidity("");
    felt.reportValidity();
    return true;
}

/**
 * Validerer om et startnummer allerede er registrert blant deltagerne.
 *
 * @param {HTMLInputElement} startnr - Inputfeltet som inneholder startnummeret som skal valideres.
 * @param {Deltager[]} deltagere - Listen over eksisterende deltagere som skal sjekkes mot.
 * @returns {boolean} Returnerer true hvis startnummeret er unikt, false hvis det allerede er registrert.
 */
function validerStartnummer(startnr, deltagere) {
    const alleredeRegistrert = deltagere.some(deltager => startnr.value == deltager.startnr);
    if (alleredeRegistrert) {
        startnr.setCustomValidity(`Startnummer ${startnr.value} er allerede registrert`);
        startnr.reportValidity();
        startnr.focus();
        return false;
    }
    startnr.setCustomValidity("");
    startnr.reportValidity();
    return true;
}

/**
 * Formaterer et navn slik at første bokstav i hvert ord, samt første bokstav etter bindestreker, blir kapitalisert.
 *
 * @param {string} navn - Navnet som skal formateres.
 * @returns {string} Det formaterte navnet med korrekt kapitalisering.
 */
function formatereNavn(navn) {
    return navn.toLowerCase()
                .split(" ")
                .map(ord => ord.split("-").map(delOrd => delOrd.charAt(0).toUpperCase() + delOrd.slice(1)).join("-"))
                .join(" ");
}

/**
 * Sorterer deltagerne og justerer verdien i plassering.
 *
 * @param {Deltager[]} deltagere - En liste med deltagerobjekter som skal justeres.
 */
function sorterDeltagere(deltagere) {
    deltagere.sort((a, b) => a.sluttid - b.sluttid); 
    deltagere.forEach((deltager, indeks) => deltager.plassering = indeks + 1);
}

/**
 * Oppdaterer registreringsmeldingen med deltagerens navn, startnummer og sluttid.
 *
 * @param {string} navnValue - Det formaterte navnet til deltageren.
 * @param {string|number} startnrValue - Startnummeret til deltageren.
 * @param {string|number sluttidValue - Sluttiden til deltageren.
 */
function oppdaterMeldinger(navnValue, startnrValue, sluttidValue) {
    const [navnMsg, startnrMsg, sluttidMsg] = regMessage.getElementsByTagName("span");
    navnMsg.innerText = navnValue;
    startnrMsg.innerText = startnrValue;
    sluttidMsg.innerText = sluttidValue;
    regMessage.className = "";
}

/**
 * Nullstiller verdiene i de oppgitte inputfeltene og setter fokus på det første feltet.
 *
 * @param {...HTMLInputElement} felter - En liste over inputfelter som skal nullstilles.
 */
function nullstillFelter(...felter) {
    felter.forEach(felt => felt.value = null);
    felter[0].focus();
}

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
 * Konverterer sekunder til en tidsstreng i formatet HH:MM:SS.
 *
 * @param {number} sekunder - Sekunder som skal konverteres.
 * @returns {string} Tidsstreng i formatet HH:MM:SS.
 */
function sekunderToTidString(sekunder) {
    const timer = Math.floor(sekunder / 3600);
    sekunder %= 3600; 
    const minutter = Math.floor(sekunder / 60); 
    sekunder = sekunder % 60; 

    const timerStr = String(timer).padStart(2, '0');
    const minutterStr = String(minutter).padStart(2, '0');
    const sekunderStr = String(sekunder).padStart(2, '0');

    return `${timerStr}:${minutterStr}:${sekunderStr}`; 
}

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
    if (!fraTid) return deltagere.filter(deltager => deltager.sluttid <= tilTid);
    if (!tilTid) return deltagere.filter(deltager => deltager.sluttid >= fraTid);
    return deltagere.filter((deltager) => deltager.sluttid >= fraTid)
                    .filter((deltager) => deltager.sluttid <= tilTid);
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
        sluttid.innerText = sekunderToTidString(deltager.sluttid);

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

    if (!validerStartnummer(startnr, deltagere)) return;

    const navnValue = formatereNavn(navn.value);

    deltagere.push(new Deltager(startnr.value, 
                                navnValue, 
                                tidStringToSekunder(sluttid.value))); 
    sorterDeltagere(deltagere)

    oppdaterMeldinger(navnValue, startnr.value, sluttid.value);
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
    }
    tilTid.setCustomValidity("");
    tilTid.reportValidity();
    
    const onsketDeltagere = velgDeltagere(fraTidValue, tilTidValue, deltagere)

    visDeltagere(onsketDeltagere)
    nullstillFelter(fraTid, tilTid);
});
