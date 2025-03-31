!/**
 * Highstock JS v12.0.2 (2024-12-04)
 * @module highcharts/indicators/cci
 * @requires highcharts
 * @requires highcharts/modules/stock
 *
 * Indicator series type for Highcharts Stock
 *
 * (c) 2010-2024 Sebastian Bochan
 *
 * License: www.highcharts.com/license
 */function(t,r){"object"==typeof exports&&"object"==typeof module?module.exports=r(require("highcharts"),require("highcharts").SeriesRegistry):"function"==typeof define&&define.amd?define("highcharts/indicators/cci",[["highcharts/highcharts"],["highcharts/highcharts","SeriesRegistry"]],r):"object"==typeof exports?exports["highcharts/indicators/cci"]=r(require("highcharts"),require("highcharts").SeriesRegistry):t.Highcharts=r(t.Highcharts,t.Highcharts.SeriesRegistry)}(this,function(t,r){return function(){"use strict";var e,n={512:function(t){t.exports=r},944:function(r){r.exports=t}},i={};function o(t){var r=i[t];if(void 0!==r)return r.exports;var e=i[t]={exports:{}};return n[t](e,e.exports,o),e.exports}o.n=function(t){var r=t&&t.__esModule?function(){return t.default}:function(){return t};return o.d(r,{a:r}),r},o.d=function(t,r){for(var e in r)o.o(r,e)&&!o.o(t,e)&&Object.defineProperty(t,e,{enumerable:!0,get:r[e]})},o.o=function(t,r){return Object.prototype.hasOwnProperty.call(t,r)};var s={};o.d(s,{default:function(){return l}});var u=o(944),c=/*#__PURE__*/o.n(u),a=o(512),h=/*#__PURE__*/o.n(a),f=(e=function(t,r){return(e=Object.setPrototypeOf||({__proto__:[]})instanceof Array&&function(t,r){t.__proto__=r}||function(t,r){for(var e in r)r.hasOwnProperty(e)&&(t[e]=r[e])})(t,r)},function(t,r){function n(){this.constructor=t}e(t,r),t.prototype=null===r?Object.create(r):(n.prototype=r.prototype,new n)}),p=h().seriesTypes.sma,g=c().isArray,y=c().merge,d=function(t){function r(){return null!==t&&t.apply(this,arguments)||this}return f(r,t),r.prototype.getValues=function(t,r){var e,n,i,o,s,u,c,a=r.period,h=t.xData,f=t.yData,p=f?f.length:0,y=[],d=[],l=[],v=[],x=[],_=1;if(!(h.length<=a)&&g(f[0])&&4===f[0].length){for(;_<a;)n=f[_-1],y.push((n[1]+n[2]+n[3])/3),_++;for(c=a;c<=p;c++)s=((n=f[c-1])[1]+n[2]+n[3])/3,i=y.push(s),o=(x=y.slice(i-a)).reduce(function(t,r){return t+r},0)/a,u=function(t,r){var e,n=t.length,i=0;for(e=0;e<n;e++)i+=Math.abs(r-t[e]);return i}(x,o)/a,e=(s-o)/(.015*u),d.push([h[c-1],e]),l.push(h[c-1]),v.push(e);return{values:d,xData:l,yData:v}}},r.defaultOptions=y(p.defaultOptions,{params:{index:void 0}}),r}(p);h().registerSeriesType("cci",d);var l=c();return s.default}()});