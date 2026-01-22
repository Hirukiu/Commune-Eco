async function getEnergyConsumption(INSEE){
	const res = await fetch(`https://data.ademe.fr/data-fair/api/v1/datasets/dpe-france/metric_agg?q=${INSEE}&q_fields=code_insee_commune_actualise&field=consommation_energie&metric=avg`);
	if (!res.ok) {
		console.warn(`Erreur API ADEME (${res.status})`);
		return null;
	}
	const data = await res.json();
	return(data.value);
}

async function getWaterScore(INSEE){

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

async function getConsoElec(INSEE){

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
	
	
	while (i < result.length){
		let tmp;
		
		tmp = result[i].conso_totale_mwh

		if (result[i].filiere != "Electricité")
		{
			tmp = tmp * 4;
			gaz = gaz + result[i].conso_totale_mwh;
		}
		usage = usage + tmp
		i = i +1;
	}

	const ratio = gaz / usage;
	
	usage = (usage * 0.059)/population;

	return {
		production_polution : usage,
		utilisation_gaz : gaz,
		taux_gaz : ratio
	}
}
async function getINSEE(commune){

	const res = await fetch(`https://geo.api.gouv.fr/communes?nom=${commune}`)

	if (!res.ok) {
			console.warn(`Erreur API ADEME (${res.status})`);
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
		population : first.population
	}
}

function calScore(pollution, water, energy) {
	const p = pollution ? pollution.production_polution : 0;
	const w = water ? water.score : 0;
	const e = energy || 0;

	const score = p * w * e;
	return score;
}

async function getAllInfo(commune)
{
	const ville = await getINSEE(commune);

	if (!ville || !ville.INSEE) {
	    console.warn(`commune non trouvée`);
	    return null;
	}
	
	const INSEE = ville.INSEE;
	
	if(!INSEE){
		console.warn(`commune non trouvée`);
		return null;
	}

	const polution = await getConsoElec(INSEE);
	const water = await getWaterScore(INSEE);
	const energy = await getEnergyConsumption(INSEE);

	if(!polution || !water || !energy){
		console.warn(`Commune non trouvée par une API`)
	}

	const score_final = calScore(polution, water, energy);

	return {
		ville : ville,
		moyenne_isolation: energy,
		water_quality:water,
		polution: polution,
		score_final: score_final
	}
}

export {
  getEnergyConsumption,
  getWaterScore,
  getConsoElec,
  getINSEE,
  calScore,
  getAllInfo
};