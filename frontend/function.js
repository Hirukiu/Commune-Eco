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

	if (!resBac1.ok && !resBac2.ok && !resTot.ok) {
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
	const ratio = totalFails / countTotal;

	return {
		score: Math.round((ratio * 1000) / 1000,),
		total_tests: countTotal,
		total_incidents: totalFails,
		detail: {
			ecoli: countEcoliFail,
			enterocoques: countEnteroFail
		}
	};
}

async function getConsoElec(INSEE){

	const res = await fecth(`https://opendata.agenceore.fr/api/explore/v2.1/catalog/datasets/consommation-annuelle-d-electricite-et-gaz-par-commune/records?where=code_commune=${INSEE} AND annee=2024&select=filiere,conso_totale_mwh`)	

	if (!res.ok) {
		console.warn(`Erreur API ADEME (${res.status})`);
		return null;
	}

	const data = await res.json();
	const result = data.results;
		
	let i;
	let usage;
	let gaz;

	i = 0;
	usage = 0;
	gaz = 0;
	while (i < result.len){
		let tmp;

		tmp = result[i].conso_totale_mwh

		if (result[i].filiere != "Electricité")
		{
			tmp = tmp * 4;
			gaz = gaz + result[i].conso_totale_mwh;
		}
		usage = usage + tmp
	}

	const ratio = gaz / usage;
	
	usage = (usage / i) * 0.059;
	
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
	const first = data[0];

	return {
		name: first.nom,
		INSEE: first.code
	}
}

async function calScore(INSEE){
	const polutions = getConsoElec(INSEE);
	const water = getWaterScore(INSEE);
	const energy = getEnergyConsumption(INSEE);

}
