const got = require('got');
const csv = require('csvtojson');
const fp = require('lodash/fp');
const stateAbbreviations=require('./states_hash.json');
const titleCase = fp.flow(fp.lowerCase,fp.startCase);

const writeFile = require('fs').writeFileSync;
const readFile =  require('fs').readFileSync;

const importURL = 'https://www.nationalnanpa.com/nanp1/npa_report.csv';

run();

async function run(){
	var areaCodesUS={};
	var areaCodesUSExpanded={};
	var areaCodesCA={};
	var areaCodesOther={};
	var areaCodesAllExpanded={};
	
	var result = await got(importURL);
	result = result.body;
	//result = readFile('./npa_report.csv',{encoding:'utf8'});
	//console.log(result);
	if(result.slice(0,9)=='File Date') {
		//remove the first non-header row
		result = result.split('\n');
		result.shift();
		result = result.join('\n');
		}
	
	csv().fromString(result)
	.subscribe(function(data){
		//console.log(data);
		//normal USA locations with a typical state. Save 3 copies: USA only, USA only with 2 digit state, and add to the full list.
		if(data.COUNTRY=='US' && data.LOCATION.length==2){
			//console.log(data.NPA_ID, data.LOCATION);
			areaCodesUS[data.NPA_ID]=data.LOCATION;
			areaCodesUSExpanded[data.NPA_ID]=stateAbbreviations[data.LOCATION];
			areaCodesAllExpanded[data.NPA_ID]='USA, ' + stateAbbreviations[data.LOCATION];
			}
		//Other locations "inside" USA. Saving these to other.
		else if (data.COUNTRY=='US' && data.LOCATION.length>2){
			//USVI			US
			//PUERTO RICO		US
			if(data.LOCATION=='USVI') {
				areaCodesOther[data.NPA_ID] = 'U.S. Virgin Islands';
				areaCodesAllExpanded[data.NPA_ID]='U.S. Virgin Islands';
				}
			else {
				areaCodesAllExpanded[data.NPA_ID]=titleCase(data.LOCATION);
				areaCodesOther[data.NPA_ID]=titleCase(data.LOCATION);
				}
			}
		//Saving canada to it's own list & to the full list.
		if(data.COUNTRY=='CANADA' && data.LOCATION.length>0){
			//console.log(data.NPA_ID, data.LOCATION);
			areaCodesCA[data.NPA_ID]=titleCase(data.LOCATION);
			areaCodesAllExpanded[data.NPA_ID]='Canada, ' + titleCase(data.LOCATION);
			}
		//Saving all others to the full list and an "other" list.
		if(data.COUNTRY.length>0 && !['US','CANADA'].includes(data.COUNTRY)){
			areaCodesOther[data.NPA_ID]=titleCase(data.COUNTRY);
			areaCodesAllExpanded[data.NPA_ID]=titleCase(data.COUNTRY);
			}
		})
	.then(function(){
		writeFile('./data/area-codes-us-short.json',JSON.stringify(areaCodesUS,			null,1));
		writeFile('./data/area-codes-us.json',		JSON.stringify(areaCodesUSExpanded,	null,1));
		writeFile('./data/area-codes-ca.json',		JSON.stringify(areaCodesCA,			null,1));
		writeFile('./data/area-codes-other.json',	JSON.stringify(areaCodesOther,		null,1));
		writeFile('./data/area-codes-all.json',		JSON.stringify(areaCodesAllExpanded,null,1));
		});
	}