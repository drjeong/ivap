!/**
 * Highcharts JS v12.0.2 (2024-12-04)
 * @module highcharts/modules/export-data
 * @requires highcharts
 * @requires highcharts/modules/exporting
 *
 * Exporting module
 *
 * (c) 2010-2024 Torstein Honsi
 *
 * License: www.highcharts.com/license
 */function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e(require("highcharts"),require("highcharts").AST):"function"==typeof define&&define.amd?define("highcharts/modules/export-data",[["highcharts/highcharts"],["highcharts/highcharts","AST"]],e):"object"==typeof exports?exports["highcharts/modules/export-data"]=e(require("highcharts"),require("highcharts").AST):t.Highcharts=e(t.Highcharts,t.Highcharts.AST)}(this,function(t,e){return function(){"use strict";var a={660:function(t){t.exports=e},944:function(e){e.exports=t}},o={};function n(t){var e=o[t];if(void 0!==e)return e.exports;var i=o[t]={exports:{}};return a[t](i,i.exports,n),i.exports}n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,{a:e}),e},n.d=function(t,e){for(var a in e)n.o(e,a)&&!n.o(t,a)&&Object.defineProperty(t,a,{enumerable:!0,get:e[a]})},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)};var i={};n.d(i,{default:function(){return X}});var r=n(944),s=/*#__PURE__*/n.n(r),l=s().isSafari,c=s().win,h=s().win.document,d=c.URL||c.webkitURL||c;function p(t){var e=t.replace(/filename=.*;/,"").match(/data:([^;]*)(;base64)?,([A-Z+\d\/]+)/i);if(e&&e.length>3&&c.atob&&c.ArrayBuffer&&c.Uint8Array&&c.Blob&&d.createObjectURL){for(var a=c.atob(e[3]),o=new c.ArrayBuffer(a.length),n=new c.Uint8Array(o),i=0;i<n.length;++i)n[i]=a.charCodeAt(i);return d.createObjectURL(new c.Blob([n],{type:e[1]}))}}var u={dataURLtoBlob:p,downloadURL:function(t,e){var a=c.navigator,o=h.createElement("a");if("string"!=typeof t&&!(t instanceof String)&&a.msSaveOrOpenBlob){a.msSaveOrOpenBlob(t,e);return}if(t=""+t,a.userAgent.length>1e3)throw Error("Input too long");var n=/Edge\/\d+/.test(a.userAgent);if((l&&"string"==typeof t&&0===t.indexOf("data:application/pdf")||n||t.length>2e6)&&!(t=p(t)||""))throw Error("Failed to convert to blob");if(void 0!==o.download)o.href=t,o.download=e,h.body.appendChild(o),o.click(),h.body.removeChild(o);else try{if(!c.open(t,"chart"))throw Error("Failed to open window")}catch(e){c.location.href=t}}},f=n(660),g=/*#__PURE__*/n.n(f),m={exporting:{csv:{annotations:{itemDelimiter:"; ",join:!1},columnHeaderFormatter:null,dateFormat:"%Y-%m-%d %H:%M:%S",decimalPoint:null,itemDelimiter:null,lineDelimiter:"\n"},showTable:!1,useMultiLevelHeaders:!0,useRowspanHeaders:!0,showExportInProgress:!0},lang:{downloadCSV:"Download CSV",downloadXLS:"Download XLS",exportData:{annotationHeader:"Annotations",categoryHeader:"Category",categoryDatetimeHeader:"DateTime"},viewData:"View data table",hideData:"Hide data table",exportInProgress:"Exporting..."}},x=function(t,e,a){if(a||2==arguments.length)for(var o,n=0,i=e.length;n<i;n++)!o&&n in e||(o||(o=Array.prototype.slice.call(e,0,n)),o[n]=e[n]);return t.concat(o||Array.prototype.slice.call(e))},v=s().getOptions,b=s().setOptions,y=u.downloadURL,w=s().doc,T=s().win,D=s().addEvent,S=s().defined,E=s().extend,L=s().find,A=s().fireEvent,C=s().isNumber,O=s().pick;function k(t){var e,a=this,o=!!(null===(e=this.options.exporting)||void 0===e?void 0:e.showExportInProgress),n=T.requestAnimationFrame||setTimeout;n(function(){o&&a.showLoading(a.options.lang.exportInProgress),n(function(){try{t.call(a)}finally{o&&a.hideLoading()}})})}function R(){var t=this;k.call(this,function(){var e=t.getCSV(!0);y(j(e,"text/csv")||"data:text/csv,\uFEFF"+encodeURIComponent(e),t.getFilename()+".csv")})}function N(){var t=this;k.call(this,function(){var e='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head>\x3c!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Ark1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--\x3e<style>td{border:none;font-family: Calibri, sans-serif;} .number{mso-number-format:"0.00";} .text{ mso-number-format:"@";}</style><meta name=ProgId content=Excel.Sheet><meta charset=UTF-8></head><body>'+t.getTable(!0)+"</body></html>";y(j(e,"application/vnd.ms-excel")||"data:application/vnd.ms-excel;base64,"+T.btoa(unescape(encodeURIComponent(e))),t.getFilename()+".xls")})}function V(t){var e="",a=this.getDataRows(),o=this.options.exporting.csv,n=O(o.decimalPoint,","!==o.itemDelimiter&&t?1.1.toLocaleString()[1]:"."),i=O(o.itemDelimiter,","===n?";":","),r=o.lineDelimiter;return a.forEach(function(t,o){for(var s="",l=t.length;l--;)"string"==typeof(s=t[l])&&(s='"'.concat(s,'"')),"number"==typeof s&&"."!==n&&(s=s.toString().replace(".",n)),t[l]=s;t.length=a.length?a[0].length:0,e+=t.join(i),o<a.length-1&&(e+=r)}),e}function H(t){var e,a,o,n,i,r,s,l=this.hasParallelCoordinates,c=this.time,h=this.options.exporting&&this.options.exporting.csv||{},d=this.xAxis,p={},u=[],f=[],g=[],m=this.options.lang.exportData,v=m.categoryHeader,b=m.categoryDatetimeHeader,y=function(e,a,o){if(h.columnHeaderFormatter){var n=h.columnHeaderFormatter(e,a,o);if(!1!==n)return n}return e?e.bindAxes?t?{columnTitle:o>1?a:e.name,topLevelColumnTitle:e.name}:e.name+(o>1?" ("+a+")":""):e.options.title&&e.options.title.text||(e.dateTime?b:v):v},w=function(t,e,a){var o={},n={};return e.forEach(function(e){var i=(t.keyToAxis&&t.keyToAxis[e]||e)+"Axis",r=C(a)?t.chart[i][a]:t[i];o[e]=r&&r.categories||[],n[e]=r&&r.dateTime}),{categoryMap:o,dateTimeValueAxisMap:n}},T=function(t,e){var a=t.pointArrayMap||["y"];return t.data.some(function(t){return void 0!==t.y&&t.name})&&e&&!e.categories&&"name"!==t.exportKey?x(["x"],a,!0):a},D=[],E=0;for(r in this.series.forEach(function(e){var a,o,n=e.options.keys,r=e.xAxis,s=n||T(e,r),u=s.length,m=!e.requireSorting&&{},x=d.indexOf(r),v=w(e,s);if(!1!==e.options.includeInDataExport&&!e.options.isInternal&&!1!==e.visible){for(L(D,function(t){return t[0]===x})||D.push([x,E]),o=0;o<u;)i=y(e,s[o],s.length),g.push(i.columnTitle||i),t&&f.push(i.topLevelColumnTitle||i),o++;a={chart:e.chart,autoIncrement:e.autoIncrement,options:e.options,pointArrayMap:e.pointArrayMap,index:e.index},e.options.data.forEach(function(t,n){var i,d,f,g,b={series:a};l&&(v=w(e,s,n)),e.pointClass.prototype.applyOptions.apply(b,[t]);var y=e.data[n]&&e.data[n].name;if(d=(null!==(i=b.x)&&void 0!==i?i:"")+","+y,o=0,(!r||"name"===e.exportKey||!l&&r&&r.hasNames&&y)&&(d=y),m&&(m[d]&&(d+="|"+n),m[d]=!0),p[d]){var T=""+d+",".concat(p[d].pointers[e.index]),D=d;p[d].pointers[e.index]&&(p[T]||(p[T]=[],p[T].xValues=[],p[T].pointers=[]),d=T),p[D].pointers[e.index]+=1}else{p[d]=[],p[d].xValues=[];for(var S=[],L=0;L<e.chart.series.length;L++)S[L]=0;p[d].pointers=S,p[d].pointers[e.index]=1}for(p[d].x=b.x,p[d].name=y,p[d].xValues[x]=b.x;o<u;)f=s[o],g=e.pointClass.prototype.getNestedProperty.apply(b,[f]),p[d][E+o]=O(v.categoryMap[f][g],v.dateTimeValueAxisMap[f]?c.dateFormat(h.dateFormat,g):null,g),o++}),E+=o}}),p)Object.hasOwnProperty.call(p,r)&&u.push(p[r]);for(n=t?[f,g]:[g],E=D.length;E--;)e=D[E][0],a=D[E][1],o=d[e],u.sort(function(t,a){return t.xValues[e]-a.xValues[e]}),s=y(o),n[0].splice(a,0,s),t&&n[1]&&n[1].splice(a,0,s),u.forEach(function(t){var e=t.name;o&&!S(e)&&(o.dateTime?(t.x instanceof Date&&(t.x=t.x.getTime()),e=c.dateFormat(h.dateFormat,t.x)):e=o.categories?O(o.names[t.x],o.categories[t.x],t.x):t.x),t.splice(a,0,e)});return A(this,"exportData",{dataRows:n=n.concat(u)}),n}function B(t){var e=function(t){if(!t.tagName||"#text"===t.tagName)return t.textContent||"";var a=t.attributes,o="<".concat(t.tagName);return a&&Object.keys(a).forEach(function(t){var e=a[t];o+=" ".concat(t,'="').concat(e,'"')}),o+=">",o+=t.textContent||"",(t.children||[]).forEach(function(t){o+=e(t)}),o+="</".concat(t.tagName,">")};return e(this.getTableAST(t))}function U(t){var e=0,a=[],o=this.options,n=t?1.1.toLocaleString()[1]:".",i=O(o.exporting.useMultiLevelHeaders,!0),r=this.getDataRows(i),s=i?r.shift():null,l=r.shift(),c=function(t,e){var a=t.length;if(e.length!==a)return!1;for(;a--;)if(t[a]!==e[a])return!1;return!0},h=function(t,e,a,o){var i=O(o,""),r="highcharts-text"+(e?" "+e:"");return"number"==typeof i?(i=i.toString(),","===n&&(i=i.replace(".",n)),r="highcharts-number"):o||(r="highcharts-empty"),{tagName:t,attributes:a=E({class:r},a),textContent:i}};!1!==o.exporting.tableCaption&&a.push({tagName:"caption",attributes:{class:"highcharts-table-caption"},textContent:O(o.exporting.tableCaption,o.title.text?o.title.text:"Chart")});for(var d=0,p=r.length;d<p;++d)r[d].length>e&&(e=r[d].length);a.push(function(t,e,a){var n,r,s=[],l=0,d=a||e&&e.length,p=0;if(i&&t&&e&&!c(t,e)){for(var u=[];l<d;++l)if((n=t[l])===t[l+1])++p;else if(p)u.push(h("th","highcharts-table-topheading",{scope:"col",colspan:p+1},n)),p=0;else{n===e[l]?o.exporting.useRowspanHeaders?(r=2,delete e[l]):(r=1,e[l]=""):r=1;var f=h("th","highcharts-table-topheading",{scope:"col"},n);r>1&&f.attributes&&(f.attributes.valign="top",f.attributes.rowspan=r),u.push(f)}s.push({tagName:"tr",children:u})}if(e){var u=[];for(l=0,d=e.length;l<d;++l)void 0!==e[l]&&u.push(h("th",null,{scope:"col"},e[l]));s.push({tagName:"tr",children:u})}return{tagName:"thead",children:s}}(s,l,Math.max(e,l.length)));var u=[];r.forEach(function(t){for(var a=[],o=0;o<e;o++)a.push(h(o?"td":"th",null,o?{}:{scope:"row"},t[o]));u.push({tagName:"tr",children:a})}),a.push({tagName:"tbody",children:u});var f={tree:{tagName:"table",id:"highcharts-data-table-".concat(this.index),children:a}};return A(this,"aftergetTableAST",f),f.tree}function F(){this.toggleDataTable(!1)}function I(t){var e=(t=O(t,!this.isDataTableVisible))&&!this.dataTableDiv;if(e&&(this.dataTableDiv=w.createElement("div"),this.dataTableDiv.className="highcharts-data-table",this.renderTo.parentNode.insertBefore(this.dataTableDiv,this.renderTo.nextSibling)),this.dataTableDiv){var a=this.dataTableDiv.style,o=a.display;a.display=t?"block":"none",t?(this.dataTableDiv.innerHTML=g().emptyHTML,new(g())([this.getTableAST()]).addToDOM(this.dataTableDiv),A(this,"afterViewData",{element:this.dataTableDiv,wasHidden:e||o!==a.display})):A(this,"afterHideData")}this.isDataTableVisible=t;var n=this.exportDivElements,i=this.options.exporting,r=i&&i.buttons&&i.buttons.contextButton.menuItems,s=this.options.lang;if(i&&i.menuItemDefinitions&&s&&s.viewData&&s.hideData&&r&&n){var l=n[r.indexOf("viewData")];l&&g().setElementHTML(l,this.isDataTableVisible?s.hideData:s.viewData)}}function M(){this.toggleDataTable(!0)}function j(t,e){var a=T.navigator,o=T.URL||T.webkitURL||T;try{if(a.msSaveOrOpenBlob&&T.MSBlobBuilder){var n=new T.MSBlobBuilder;return n.append(t),n.getBlob("image/svg+xml")}return o.createObjectURL(new T.Blob(["\uFEFF"+t],{type:e}))}catch(t){}}function P(){var t=this,e=t.dataTableDiv,a=function(t,e){return t.children[e].textContent};if(e&&t.options.exporting&&t.options.exporting.allowTableSorting){var o=e.querySelector("thead tr");o&&o.childNodes.forEach(function(o){var n=o.closest("table");o.addEventListener("click",function(){var i,r,s=x([],e.querySelectorAll("tr:not(thead tr)"),!0),l=x([],o.parentNode.children,!0);s.sort((i=l.indexOf(o),r=t.ascendingOrderInTable=!t.ascendingOrderInTable,function(t,e){var o,n;return o=a(r?t:e,i),n=a(r?e:t,i),""===o||""===n||isNaN(o)||isNaN(n)?o.toString().localeCompare(n):o-n})).forEach(function(t){n.appendChild(t)}),l.forEach(function(t){["highcharts-sort-ascending","highcharts-sort-descending"].forEach(function(e){t.classList.contains(e)&&t.classList.remove(e)})}),o.classList.add(t.ascendingOrderInTable?"highcharts-sort-ascending":"highcharts-sort-descending")})})}}function K(){this.options&&this.options.exporting&&this.options.exporting.showTable&&!this.options.chart.forExport&&this.viewData()}function q(){var t;null===(t=this.dataTableDiv)||void 0===t||t.remove()}var W=s();W.dataURLtoBlob=W.dataURLtoBlob||u.dataURLtoBlob,W.downloadURL=W.downloadURL||u.downloadURL,({compose:function(t,e){var a=t.prototype;if(!a.getCSV){var o=v().exporting;D(t,"afterViewData",P),D(t,"render",K),D(t,"destroy",q),a.downloadCSV=R,a.downloadXLS=N,a.getCSV=V,a.getDataRows=H,a.getTable=B,a.getTableAST=U,a.hideData=F,a.toggleDataTable=I,a.viewData=M,o&&(E(o.menuItemDefinitions,{downloadCSV:{textKey:"downloadCSV",onclick:function(){this.downloadCSV()}},downloadXLS:{textKey:"downloadXLS",onclick:function(){this.downloadXLS()}},viewData:{textKey:"viewData",onclick:function(){k.call(this,this.toggleDataTable)}}}),o.buttons&&o.buttons.contextButton.menuItems&&o.buttons.contextButton.menuItems.push("separator","downloadCSV","downloadXLS","viewData")),b(m);var n=e.types,i=n.arearange,r=n.gantt,s=n.map,l=n.mapbubble,c=n.treemap,h=n.xrange;i&&(i.prototype.keyToAxis={low:"y",high:"y"}),r&&(r.prototype.exportKey="name",r.prototype.keyToAxis={start:"x",end:"x"}),s&&(s.prototype.exportKey="name"),l&&(l.prototype.exportKey="name"),c&&(c.prototype.exportKey="name"),h&&(h.prototype.keyToAxis={x2:"x"})}}}).compose(W.Chart,W.Series);var X=s();return i.default}()});