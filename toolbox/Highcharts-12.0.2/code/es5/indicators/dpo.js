!/**
 * Highstock JS v12.0.2 (2024-12-04)
 * @module highcharts/indicators/dpo
 * @requires highcharts
 * @requires highcharts/modules/stock
 *
 * Indicator series type for Highcharts Stock
 *
 * (c) 2010-2024 Wojciech Chmiel
 *
 * License: www.highcharts.com/license
 */function(t,r){"object"==typeof exports&&"object"==typeof module?module.exports=r(require("highcharts"),require("highcharts").SeriesRegistry):"function"==typeof define&&define.amd?define("highcharts/indicators/dpo",[["highcharts/highcharts"],["highcharts/highcharts","SeriesRegistry"]],r):"object"==typeof exports?exports["highcharts/indicators/dpo"]=r(require("highcharts"),require("highcharts").SeriesRegistry):t.Highcharts=r(t.Highcharts,t.Highcharts.SeriesRegistry)}(this,function(t,r){return function(){"use strict";var e,o={512:function(t){t.exports=r},944:function(r){r.exports=t}},n={};function i(t){var r=n[t];if(void 0!==r)return r.exports;var e=n[t]={exports:{}};return o[t](e,e.exports,i),e.exports}i.n=function(t){var r=t&&t.__esModule?function(){return t.default}:function(){return t};return i.d(r,{a:r}),r},i.d=function(t,r){for(var e in r)i.o(r,e)&&!i.o(t,e)&&Object.defineProperty(t,e,{enumerable:!0,get:r[e]})},i.o=function(t,r){return Object.prototype.hasOwnProperty.call(t,r)};var s={};i.d(s,{default:function(){return O}});var a=i(944),u=/*#__PURE__*/i.n(a),c=i(512),h=/*#__PURE__*/i.n(c),p=(e=function(t,r){return(e=Object.setPrototypeOf||({__proto__:[]})instanceof Array&&function(t,r){t.__proto__=r}||function(t,r){for(var e in r)r.hasOwnProperty(e)&&(t[e]=r[e])})(t,r)},function(t,r){function o(){this.constructor=t}e(t,r),t.prototype=null===r?Object.create(r):(o.prototype=r.prototype,new o)}),f=h().seriesTypes.sma,d=u().extend,y=u().merge,g=u().correctFloat,l=u().pick;function x(t,r,e,o,n){var i=l(r[e][o],r[e]);return n?g(t-i):g(t+i)}var v=function(t){function r(){return null!==t&&t.apply(this,arguments)||this}return p(r,t),r.prototype.getValues=function(t,r){var e,o,n,i,s,a=r.period,u=r.index,c=Math.floor(a/2+1),h=a+c,p=t.xData||[],f=t.yData||[],d=f.length,y=[],g=[],v=[],O=0;if(!(p.length<=h)){for(i=0;i<a-1;i++)O=x(O,f,i,u);for(s=0;s<=d-h;s++)o=s+a-1,n=s+h-1,O=x(O,f,o,u),e=l(f[n][u],f[n])-O/a,O=x(O,f,s,u,!0),y.push([p[n],e]),g.push(p[n]),v.push(e);return{values:y,xData:g,yData:v}}},r.defaultOptions=y(f.defaultOptions,{params:{index:0,period:21}}),r}(f);d(v.prototype,{nameBase:"DPO"}),h().registerSeriesType("dpo",v);var O=u();return s.default}()});