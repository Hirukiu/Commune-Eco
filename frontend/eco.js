//import {getEnergyConsumption,getWaterScore,getConsoElec,getINSEE,calScore, getAllInfo} from './function.js';
async function getEnergyConsumption(INSEE) {
    const res = await fetch(`https://data.ademe.fr/data-fair/api/v1/datasets/dpe-france/metric_agg?q=33063&q_fields=code_insee_commune_actualise&field=consommation_energie&metric=avg`)
    if (!res.ok) {
        console.warn(`Erreur API ADEME (${res.status})`);
        return null;
    }
    const data = await res.json();
    return (Math.round(data.metric * 10) / 10);

}

async function getWaterScore(INSEE) {

    const resBac1 = await fetch(`https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?code_commune=${INSEE}&date_min=2025-01-01&code_parametre=1449&conformite_limites_bact_prelevement=N&size=1`)
    const resBac2 = await fetch(`https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?code_commune=${INSEE}&date_min=2025-01-01&code_parametre=1447&conformite_limites_bact_prelevement=N&size=1`)
    const resTot = await fetch(`https://hubeau.eaufrance.fr/api/v1/qualite_eau_potable/resultats_dis?code_commune=${INSEE}&date_min=2025-01-01&code_parametre=1449&size=1`)

    if (!resBac1.ok || !resBac2.ok || !resTot.ok) {
        console.warn(`Erreur API ADEME`);
        return null;
    }

    const dataBac1 = await resBac1.json();
    const dataBac2 = await resBac2.json();
    const dataTot = await resTot.json();

    const countEcoliFail = dataBac1.count || 0;
    const countEnteroFail = dataBac2.count || 0;
    const countTotal = dataTot.count || 0;

    const totalFails = countEcoliFail + countEnteroFail;
    const ratio = (countTotal - totalFails) / countTotal;

    return {
        score: Math.round(ratio * 1000) / 1000,
        total_tests: countTotal,
        total_incidents: totalFails,
        detail: {
            ecoli: countEcoliFail,
            enterocoques: countEnteroFail
        }
    };
}

async function getConsoElec(INSEE) {

    const res = await fetch(`https://opendata.agenceore.fr/api/explore/v2.1/catalog/datasets/consommation-annuelle-d-electricite-et-gaz-par-commune/records?where=code_commune=${INSEE} AND annee=2024&select=filiere,conso_totale_mwh,nombre_d_habitants`)

    if (!res.ok) {
        console.warn(`Erreur API ADEME (${res.status})`);
        return null;
    }
    let i = 0;
    let usage = 0;
    let gaz = 0;
    const data = await res.json();
    const result = data.results;

    if (!result || result.length === 0) {
        console.warn(`Pas de données ${INSEE}`);
        return null;
    }

    const population = result[i].nombre_d_habitants;
    while (i < result.length) {
        let tmp = result[i].conso_totale_mwh || 0;

        if (result[i].filiere != "Electricité") {
            tmp = tmp * 4;
            gaz = gaz + result[i].conso_totale_mwh;
        }
        usage = usage + tmp;
        i++;
    }
    const ratio = gaz / usage;

    usage = (usage * 59) / population;
    return {
        production_polution: Math.round(usage * 10) / 10,
        utilisation_gaz: gaz,
        taux_gaz: ratio
    }
}
async function getINSEE(commune) {

    const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${commune}`)

    if (!res.ok) {
        console.warn(`code INSEE non trouvée`);
        return null;
    }

    const data = await res.json();

    if (!data || data.length == 0) {
        return null;
    }

    const first = data[0];
    return {
        name: first.nom,
        INSEE: first.code,
        population: first.population
    }
}

function calScore(pollution, water, energy) {


    const p = pollution ? pollution.production_polution : 0;
    const w = water ? water.score : 0;
    const e = energy || 0;

    const score = p * w * e;

    return Math.round(score * 10) / 10;

}

async function getAllInfo(commune) {
    const ville = await getINSEE(commune);

    if (!ville || !ville.INSEE) {
        console.warn(`commune non trouvée`);
        return null;
    }
    const INSEE = ville.INSEE;

    if (!INSEE) {
        console.warn(`commune non trouvée`);
        return null;
    }

    const polution = await getConsoElec(INSEE);
    const water = await getWaterScore(INSEE);
    const energy = await getEnergyConsumption(INSEE);

    if (!polution) {
        console.warn("Donnée polution non trouvée par l'API");
        console.warn(polution)
    }

    if (!water) {
        console.warn("Donnée water non trouvée par l'API");
        console.warn(water)
    }

    if (!energy) {
        console.warn(energy)
        console.warn("Donnée energy non trouvée par l'API");
    }


    const score_final = calScore(polution, water, energy);

    return {
        ville: ville,
        moyenne_isolation: energy,
        water: water,
        polution: polution,
        score_final: score_final
    }
}

// export {
//   getEnergyConsumption,
//   getWaterScore,
//   getConsoElec,
//   getINSEE,
//   calScore,
//   getAllInfo
// };



document.getElementById('btn1').addEventListener('click', async () => {
    const informations = document.getElementById('commune1').value;
    const displayedData = await getAllInfo(informations);
    const zone = document.getElementById('zone1');
    const p1 = document.createElement('p');
    p1.textContent = displayedData.ville.ville;
    const p2 = document.createElement('p');
    p2.textContent = displayedData.water.score;
    const p3 = document.createElement('p');
    p3.textContent = displayedData.water.total_tests;
    const p4 = document.createElement('p');
    p4.textContent = displayedData.water.total_incidents;
    const p5 = document.createElement('p');
    p6.textContent = displayedData.polution.production_polution;
    const p6 = document.createElement('p');
    p7.textContent = displayedData.polution.utilisation_gaz;
    const p7 = document.createElement('p');
    p8.textContent = displayedData.polution.taux_gaz;
    const p8 = document.createElement('p');
    p9.textContent = displayedData.score_final;
    zone.textContent = "";
    zone.append(p1, p2, p3, p4, p5, p6, p7, p8);
});

document.getElementById('btn2').addEventListener('click', async () => {
    const informations = document.getElementById('commune2').value;
    const displayedData = await getAllInfo(informations);
    const zone = document.getElementById('zone2');
    const p1 = document.createElement('p');
    p1.textContent = displayedData.ville.ville;
    const p2 = document.createElement('p');
    p2.textContent = displayedData.water.score;
    const p3 = document.createElement('p');
    p3.textContent = displayedData.water.total_tests;
    const p4 = document.createElement('p');
    p4.textContent = displayedData.water.total_incidents;
    const p5 = document.createElement('p');
    p6.textContent = displayedData.polution.production_polution;
    const p6 = document.createElement('p');
    p7.textContent = displayedData.polution.utilisation_gaz;
    const p7 = document.createElement('p');
    p8.textContent = displayedData.polution.taux_gaz;
    const p8 = document.createElement('p');
    p9.textContent = displayedData.score_final;
    zone.textContent = "";
    zone.append(p1, p2, p3, p4, p5, p6, p7, p8);
});


