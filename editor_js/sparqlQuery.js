var sparqlQuery = {
name2URI: function(keywords, isaTerm){
        var uri = "http://dbpedia.org/resource/";
        var encodedKeyword = keywords.replace(" ", "_","g");
        if (true === isaTerm){
                uri += encodedKeyword;
        } else {
                uri = uri + "Category:" + encodedKeyword;
        }       
        return uri;
},
querySubterms: function(keywords, predicates){
	var queryObject =this.name2URI(keywords);
	predicates = "http://www.w3.org/2004/02/skos/core#subject";
	
		var query = "PREFIX ff: <http://factforge.net/>\r\n"+
			"PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\r\n"+
			"PREFIX dbp-prop: <http://dbpedia.org/property/>\r\n"+

			"SELECT DISTINCT ?instance ?name\r\n"+
			"WHERE { \r\n"+
			"   ?instance <" + predicates + "> <"+ queryObject + "> .\r\n" +
			"   ?instance ?p ?name\r\n"+
			"   FILTER ( ?p = ff:preferredLabel || ?p = rdfs:label || ?p = dbp-prop:name )\r\n"+
			"}";
        return query;        
},
querySuperClass: function(keywords) {
        var queryObject = keywords.replace(" ", "_", "g");
        return  "PREFIX skos: <http://www.w3.org/2004/02/skos/core#>\n" +
                        "PREFIX fb: <http://rdf.freebase.com/ns/>\n" +
                        "SELECT ?class\n" +
                        "WHERE {\n" +
                        "   ?instance fb:type.object.key \""+ queryObject + "\" .\n" +
                        "   ?instance skos:subject ?class .\n" +
                        "}"; 
},
query2URL: function(keywords, format, type){
        var prefix = "http://factforge.net/sparql?query=";
        var suffix = "&_implicit=false&_equivalent=false&format=" + format;
        var queryBase;
	if (!type){
                queryBase = this.querySubterms(keywords);
        }else{
                queryBase = this.querySuperClass(keywords);
        } 
        var query = prefix + encodeURIComponent(queryBase) + suffix;
	return query;
},
query: function(keywords, format,type, fn){
	var urlBase = this.query2URL(keywords, format, type);
	$.getJSON(urlBase + "&callback=?", function(json){
		if ('function' == typeof(fn)){
			fn(json, keywords);
		}
	});
}
};
var extJson = {data:[]};
var arrLang = new Array();
var classJson = {data:[]};
var jsonProcess = {
	sparql2Json : function(sparqlData){
		if(!sparqlData){
			return false;
		}
		var results = sparqlData.results;
		extJson = {};
		for(var index = 0; index < results.length; index++){
			var instance = results[index]["instance"];
			var name = results[index]["name"];
			var localName = decodeURIComponent(instance["localName"]); 
			var uri = instance["namespace"] + localName;
			var language = name["language"];

			if( $.inArray(language, arrLang) < 0){
				arrLang.push(language);
			}
			if ($.inArray(language, termColumnFields) >= 0){
			if ( !extJson[uri] ){
				var newArr = {"name": localName.replace('_',' ','g'),"uri":uri};//newData(uri);
				newArr[language] = decodeURIComponent(name["label"]);
				extJson[uri] = new Array();
				extJson[uri].push(newArr);
			} else {
			/*	var aIndex = 0;
				for(; aIndex <( extJson[uri]).length;aIndex++){
					if (!extJson[uri][aIndex][language]){
						break;
					}
				}
				if (aIndex >= extJson[uri].length){
					extJson[uri][aIndex] = {"uri":uri};//newData(uri);
				}
				extJson[uri][aIndex][language] = decodeURIComponent(name["label"]);
			*/
				if (extJson[uri][0][language]){
                                        extJson[uri][0][language] = extJson[uri][0][language] + ';' + decodeURIComponent(name["label"]);
                                } 
			}			
			}

		}
		var tmpJson = {};
		tmpJson["data"] = new Array();
		$.each(extJson, function(k,v){
			$.each(v, function(key,object){
				tmpJson["data"].push(object);
			});
		})
		extJson = tmpJson;
	},
	class2Json: function(sparqlData) {
			classJson["data"]=new Array();
		if (!sparqlData){
			return false;
		}
		var results = sparqlData.results;
		for(var i=0; i < results.length; i++){
			var localName = results[i]["class"]["localName"];
			var uri = results[i]["class"]["namespace"] + localName;
			var name = localName.replace("_", " ", "g").split(":");;;
			classJson["data"].push({"uri":uri, "class":name[1]});
		}
	}
};
