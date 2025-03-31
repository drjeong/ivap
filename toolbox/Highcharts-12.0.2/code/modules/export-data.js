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
 */function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e(t._Highcharts,t._Highcharts.AST):"function"==typeof define&&define.amd?define("highcharts/modules/export-data",["highcharts/highcharts"],function(t){return e(t,t.AST)}):"object"==typeof exports?exports["highcharts/modules/export-data"]=e(t._Highcharts,t._Highcharts.AST):t.Highcharts=e(t.Highcharts,t.Highcharts.AST)}("undefined"==typeof window?this:window,(t,e)=>(()=>{"use strict";var o={660:t=>{t.exports=e},944:e=>{e.exports=t}},a={};function n(t){var e=a[t];if(void 0!==e)return e.exports;var i=a[t]={exports:{}};return o[t](i,i.exports,n),i.exports}n.n=t=>{var e=t&&t.__esModule?()=>t.default:()=>t;return n.d(e,{a:e}),e},n.d=(t,e)=>{for(var o in e)n.o(e,o)&&!n.o(t,o)&&Object.defineProperty(t,o,{enumerable:!0,get:e[o]})},n.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e);var i={};n.d(i,{default:()=>$});var r=n(944),s=/*#__PURE__*/n.n(r);let{isSafari:l,win:h,win:{document:c}}=s(),d=h.URL||h.webkitURL||h;function p(t){let e=t.replace(/filename=.*;/,"").match(/data:([^;]*)(;base64)?,([A-Z+\d\/]+)/i);if(e&&e.length>3&&h.atob&&h.ArrayBuffer&&h.Uint8Array&&h.Blob&&d.createObjectURL){let t=h.atob(e[3]),o=new h.ArrayBuffer(t.length),a=new h.Uint8Array(o);for(let e=0;e<a.length;++e)a[e]=t.charCodeAt(e);return d.createObjectURL(new h.Blob([a],{type:e[1]}))}}let u={dataURLtoBlob:p,downloadURL:function(t,e){let o=h.navigator,a=c.createElement("a");if("string"!=typeof t&&!(t instanceof String)&&o.msSaveOrOpenBlob){o.msSaveOrOpenBlob(t,e);return}if(t=""+t,o.userAgent.length>1e3)throw Error("Input too long");let n=/Edge\/\d+/.test(o.userAgent);if((l&&"string"==typeof t&&0===t.indexOf("data:application/pdf")||n||t.length>2e6)&&!(t=p(t)||""))throw Error("Failed to convert to blob");if(void 0!==a.download)a.href=t,a.download=e,c.body.appendChild(a),a.click(),c.body.removeChild(a);else try{if(!h.open(t,"chart"))throw Error("Failed to open window")}catch{h.location.href=t}}};var g=n(660),m=/*#__PURE__*/n.n(g);let f={exporting:{csv:{annotations:{itemDelimiter:"; ",join:!1},columnHeaderFormatter:null,dateFormat:"%Y-%m-%d %H:%M:%S",decimalPoint:null,itemDelimiter:null,lineDelimiter:"\n"},showTable:!1,useMultiLevelHeaders:!0,useRowspanHeaders:!0,showExportInProgress:!0},lang:{downloadCSV:"Download CSV",downloadXLS:"Download XLS",exportData:{annotationHeader:"Annotations",categoryHeader:"Category",categoryDatetimeHeader:"DateTime"},viewData:"View data table",hideData:"Hide data table",exportInProgress:"Exporting..."}},{getOptions:x,setOptions:b}=s(),{downloadURL:y}=u,{doc:w,win:T}=s(),{addEvent:v,defined:D,extend:S,find:L,fireEvent:E,isNumber:A,pick:C}=s();function k(t){let e=!!this.options.exporting?.showExportInProgress,o=T.requestAnimationFrame||setTimeout;o(()=>{e&&this.showLoading(this.options.lang.exportInProgress),o(()=>{try{t.call(this)}finally{e&&this.hideLoading()}})})}function H(){k.call(this,()=>{let t=this.getCSV(!0);y(M(t,"text/csv")||"data:text/csv,\uFEFF"+encodeURIComponent(t),this.getFilename()+".csv")})}function O(){k.call(this,()=>{let t='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head>\x3c!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Ark1</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--\x3e<style>td{border:none;font-family: Calibri, sans-serif;} .number{mso-number-format:"0.00";} .text{ mso-number-format:"@";}</style><meta name=ProgId content=Excel.Sheet><meta charset=UTF-8></head><body>'+this.getTable(!0)+"</body></html>";y(M(t,"application/vnd.ms-excel")||"data:application/vnd.ms-excel;base64,"+T.btoa(unescape(encodeURIComponent(t))),this.getFilename()+".xls")})}function R(t){let e="",o=this.getDataRows(),a=this.options.exporting.csv,n=C(a.decimalPoint,","!==a.itemDelimiter&&t?1.1.toLocaleString()[1]:"."),i=C(a.itemDelimiter,","===n?";":","),r=a.lineDelimiter;return o.forEach((t,a)=>{let s="",l=t.length;for(;l--;)"string"==typeof(s=t[l])&&(s=`"${s}"`),"number"==typeof s&&"."!==n&&(s=s.toString().replace(".",n)),t[l]=s;t.length=o.length?o[0].length:0,e+=t.join(i),a<o.length-1&&(e+=r)}),e}function N(t){let e,o;let a=this.hasParallelCoordinates,n=this.time,i=this.options.exporting&&this.options.exporting.csv||{},r=this.xAxis,s={},l=[],h=[],c=[],d=this.options.lang.exportData,p=d.categoryHeader,u=d.categoryDatetimeHeader,g=function(e,o,a){if(i.columnHeaderFormatter){let t=i.columnHeaderFormatter(e,o,a);if(!1!==t)return t}return e?e.bindAxes?t?{columnTitle:a>1?o:e.name,topLevelColumnTitle:e.name}:e.name+(a>1?" ("+o+")":""):e.options.title&&e.options.title.text||(e.dateTime?u:p):p},m=function(t,e,o){let a={},n={};return e.forEach(function(e){let i=(t.keyToAxis&&t.keyToAxis[e]||e)+"Axis",r=A(o)?t.chart[i][o]:t[i];a[e]=r&&r.categories||[],n[e]=r&&r.dateTime}),{categoryMap:a,dateTimeValueAxisMap:n}},f=function(t,e){let o=t.pointArrayMap||["y"];return t.data.some(t=>void 0!==t.y&&t.name)&&e&&!e.categories&&"name"!==t.exportKey?["x",...o]:o},x=[],b,y,w,T=0,v,S;for(v in this.series.forEach(function(e){let o=e.options.keys,l=e.xAxis,d=o||f(e,l),p=d.length,u=!e.requireSorting&&{},b=r.indexOf(l),y=m(e,d),v,D;if(!1!==e.options.includeInDataExport&&!e.options.isInternal&&!1!==e.visible){for(L(x,function(t){return t[0]===b})||x.push([b,T]),D=0;D<p;)w=g(e,d[D],d.length),c.push(w.columnTitle||w),t&&h.push(w.topLevelColumnTitle||w),D++;v={chart:e.chart,autoIncrement:e.autoIncrement,options:e.options,pointArrayMap:e.pointArrayMap,index:e.index},e.options.data.forEach(function(t,o){let r,h,c;let g={series:v};a&&(y=m(e,d,o)),e.pointClass.prototype.applyOptions.apply(g,[t]);let f=e.data[o]&&e.data[o].name;if(r=(g.x??"")+","+f,D=0,(!l||"name"===e.exportKey||!a&&l&&l.hasNames&&f)&&(r=f),u&&(u[r]&&(r+="|"+o),u[r]=!0),s[r]){let t=`${r},${s[r].pointers[e.index]}`,o=r;s[r].pointers[e.index]&&(s[t]||(s[t]=[],s[t].xValues=[],s[t].pointers=[]),r=t),s[o].pointers[e.index]+=1}else{s[r]=[],s[r].xValues=[];let t=[];for(let o=0;o<e.chart.series.length;o++)t[o]=0;s[r].pointers=t,s[r].pointers[e.index]=1}for(s[r].x=g.x,s[r].name=f,s[r].xValues[b]=g.x;D<p;)h=d[D],c=e.pointClass.prototype.getNestedProperty.apply(g,[h]),s[r][T+D]=C(y.categoryMap[h][c],y.dateTimeValueAxisMap[h]?n.dateFormat(i.dateFormat,c):null,c),D++}),T+=D}}),s)Object.hasOwnProperty.call(s,v)&&l.push(s[v]);for(y=t?[h,c]:[c],T=x.length;T--;)e=x[T][0],o=x[T][1],b=r[e],l.sort(function(t,o){return t.xValues[e]-o.xValues[e]}),S=g(b),y[0].splice(o,0,S),t&&y[1]&&y[1].splice(o,0,S),l.forEach(function(t){let e=t.name;b&&!D(e)&&(b.dateTime?(t.x instanceof Date&&(t.x=t.x.getTime()),e=n.dateFormat(i.dateFormat,t.x)):e=b.categories?C(b.names[t.x],b.categories[t.x],t.x):t.x),t.splice(o,0,e)});return E(this,"exportData",{dataRows:y=y.concat(l)}),y}function V(t){let e=t=>{if(!t.tagName||"#text"===t.tagName)return t.textContent||"";let o=t.attributes,a=`<${t.tagName}`;return o&&Object.keys(o).forEach(t=>{let e=o[t];a+=` ${t}="${e}"`}),a+=">",a+=t.textContent||"",(t.children||[]).forEach(t=>{a+=e(t)}),a+=`</${t.tagName}>`};return e(this.getTableAST(t))}function B(t){let e=0,o=[],a=this.options,n=t?1.1.toLocaleString()[1]:".",i=C(a.exporting.useMultiLevelHeaders,!0),r=this.getDataRows(i),s=i?r.shift():null,l=r.shift(),h=function(t,e){let o=t.length;if(e.length!==o)return!1;for(;o--;)if(t[o]!==e[o])return!1;return!0},c=function(t,e,o,a){let i=C(a,""),r="highcharts-text"+(e?" "+e:"");return"number"==typeof i?(i=i.toString(),","===n&&(i=i.replace(".",n)),r="highcharts-number"):a||(r="highcharts-empty"),{tagName:t,attributes:o=S({class:r},o),textContent:i}};!1!==a.exporting.tableCaption&&o.push({tagName:"caption",attributes:{class:"highcharts-table-caption"},textContent:C(a.exporting.tableCaption,a.title.text?a.title.text:"Chart")});for(let t=0,o=r.length;t<o;++t)r[t].length>e&&(e=r[t].length);o.push(function(t,e,o){let n=[],r=0,s=o||e&&e.length,l,d=0,p;if(i&&t&&e&&!h(t,e)){let o=[];for(;r<s;++r)if((l=t[r])===t[r+1])++d;else if(d)o.push(c("th","highcharts-table-topheading",{scope:"col",colspan:d+1},l)),d=0;else{l===e[r]?a.exporting.useRowspanHeaders?(p=2,delete e[r]):(p=1,e[r]=""):p=1;let t=c("th","highcharts-table-topheading",{scope:"col"},l);p>1&&t.attributes&&(t.attributes.valign="top",t.attributes.rowspan=p),o.push(t)}n.push({tagName:"tr",children:o})}if(e){let t=[];for(r=0,s=e.length;r<s;++r)void 0!==e[r]&&t.push(c("th",null,{scope:"col"},e[r]));n.push({tagName:"tr",children:t})}return{tagName:"thead",children:n}}(s,l,Math.max(e,l.length)));let d=[];r.forEach(function(t){let o=[];for(let a=0;a<e;a++)o.push(c(a?"td":"th",null,a?{}:{scope:"row"},t[a]));d.push({tagName:"tr",children:o})}),o.push({tagName:"tbody",children:d});let p={tree:{tagName:"table",id:`highcharts-data-table-${this.index}`,children:o}};return E(this,"aftergetTableAST",p),p.tree}function F(){this.toggleDataTable(!1)}function I(t){let e=(t=C(t,!this.isDataTableVisible))&&!this.dataTableDiv;if(e&&(this.dataTableDiv=w.createElement("div"),this.dataTableDiv.className="highcharts-data-table",this.renderTo.parentNode.insertBefore(this.dataTableDiv,this.renderTo.nextSibling)),this.dataTableDiv){let o=this.dataTableDiv.style,a=o.display;o.display=t?"block":"none",t?(this.dataTableDiv.innerHTML=m().emptyHTML,new(m())([this.getTableAST()]).addToDOM(this.dataTableDiv),E(this,"afterViewData",{element:this.dataTableDiv,wasHidden:e||a!==o.display})):E(this,"afterHideData")}this.isDataTableVisible=t;let o=this.exportDivElements,a=this.options.exporting,n=a&&a.buttons&&a.buttons.contextButton.menuItems,i=this.options.lang;if(a&&a.menuItemDefinitions&&i&&i.viewData&&i.hideData&&n&&o){let t=o[n.indexOf("viewData")];t&&m().setElementHTML(t,this.isDataTableVisible?i.hideData:i.viewData)}}function U(){this.toggleDataTable(!0)}function M(t,e){let o=T.navigator,a=T.URL||T.webkitURL||T;try{if(o.msSaveOrOpenBlob&&T.MSBlobBuilder){let e=new T.MSBlobBuilder;return e.append(t),e.getBlob("image/svg+xml")}return a.createObjectURL(new T.Blob(["\uFEFF"+t],{type:e}))}catch(t){}}function j(){let t=this,e=t.dataTableDiv,o=(t,e)=>t.children[e].textContent,a=(t,e)=>(a,n)=>{let i,r;return i=o(e?a:n,t),r=o(e?n:a,t),""===i||""===r||isNaN(i)||isNaN(r)?i.toString().localeCompare(r):i-r};if(e&&t.options.exporting&&t.options.exporting.allowTableSorting){let o=e.querySelector("thead tr");o&&o.childNodes.forEach(o=>{let n=o.closest("table");o.addEventListener("click",function(){let i=[...e.querySelectorAll("tr:not(thead tr)")],r=[...o.parentNode.children];i.sort(a(r.indexOf(o),t.ascendingOrderInTable=!t.ascendingOrderInTable)).forEach(t=>{n.appendChild(t)}),r.forEach(t=>{["highcharts-sort-ascending","highcharts-sort-descending"].forEach(e=>{t.classList.contains(e)&&t.classList.remove(e)})}),o.classList.add(t.ascendingOrderInTable?"highcharts-sort-ascending":"highcharts-sort-descending")})})}}function P(){this.options&&this.options.exporting&&this.options.exporting.showTable&&!this.options.chart.forExport&&this.viewData()}function K(){this.dataTableDiv?.remove()}let W=s();W.dataURLtoBlob=W.dataURLtoBlob||u.dataURLtoBlob,W.downloadURL=W.downloadURL||u.downloadURL,({compose:function(t,e){let o=t.prototype;if(!o.getCSV){let a=x().exporting;v(t,"afterViewData",j),v(t,"render",P),v(t,"destroy",K),o.downloadCSV=H,o.downloadXLS=O,o.getCSV=R,o.getDataRows=N,o.getTable=V,o.getTableAST=B,o.hideData=F,o.toggleDataTable=I,o.viewData=U,a&&(S(a.menuItemDefinitions,{downloadCSV:{textKey:"downloadCSV",onclick:function(){this.downloadCSV()}},downloadXLS:{textKey:"downloadXLS",onclick:function(){this.downloadXLS()}},viewData:{textKey:"viewData",onclick:function(){k.call(this,this.toggleDataTable)}}}),a.buttons&&a.buttons.contextButton.menuItems&&a.buttons.contextButton.menuItems.push("separator","downloadCSV","downloadXLS","viewData")),b(f);let{arearange:n,gantt:i,map:r,mapbubble:s,treemap:l,xrange:h}=e.types;n&&(n.prototype.keyToAxis={low:"y",high:"y"}),i&&(i.prototype.exportKey="name",i.prototype.keyToAxis={start:"x",end:"x"}),r&&(r.prototype.exportKey="name"),s&&(s.prototype.exportKey="name"),l&&(l.prototype.exportKey="name"),h&&(h.prototype.keyToAxis={x2:"x"})}}}).compose(W.Chart,W.Series);let $=s();return i.default})());