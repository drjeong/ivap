/**
 * Handling Highcharts
 * @author Dong Hyun Jeong <djeong@udc.edu>
 *     6/19/2023 - initial version
 */

const MARGINAL_TIMESTAMP = 24 * 60 * 60 * 1000; // 24 hours

let chartLoading = 2; 	// used to determine when loading icon needs to be disappeared.
let syncing = false;	// used to determine when chart syncing needs to be enabled.

/**
 * Checking if the selected item is an object type
 * @param obj
 * @returns {boolean}
 */
function isObject(obj) {
	return obj && typeof obj === 'object';
}

/**
 * Create highlight in the selected Highchart
 * @param chart
 */
function createHighlight_in_Highcharts(chart, fromtime, totime)
{
	// Determine the region to be highlighted
	const xAxis = chart.xAxis[0],
		yAxis = chart.yAxis[0],
		xAxisPos1 = xAxis.toPixels(fromtime), // X position in pixels for region start
		xAxisPos2 = xAxis.toPixels(totime), // X position in pixels for region end
		yAxisPos1 = yAxis.toPixels(yAxis.dataMax), // Y position in pixels for region top
		yAxisPos2 = yAxis.toPixels(yAxis.dataMin), // Y position in pixels for region bottom
		width = xAxisPos2 - xAxisPos1, // Width in pixels
		height = yAxisPos2 - yAxisPos1; // Height in pixels

	// Create rectangles using chart.renderer.rect()
	if (chart.highlight_rectangles == undefined)
		chart.highlight_rectangles = [];

	// Add a rectangle to highlight the region
	const rect = chart.renderer.rect(xAxisPos1, yAxisPos1, width, height, 0)
		.attr({
			'stroke-width': 1,
			stroke: 'red',
			fill: 'rgba(255, 0, 0, 0.1)',
			zIndex: -1 // Set higher zIndex for the highlight region
		})
		.add();

	// add rect
	chart.highlight_rectangles.push({fromtime: fromtime, totime: totime, rect: rect});
}

/**
 * Process a Highcharts operation asynchronously
 * @param {string} chartId - The ID of the chart container
 * @param {Function} operation - The operation function to call with the chart
 * @returns {Promise} A promise that resolves when the operation is complete
 */
function processChartAsync(chartId, operation) {
	return new Promise(resolve => {
		setTimeout(() => {
			const chart = Highcharts.charts.find(c => c.renderTo.id === chartId);
			if (chart) {
				operation(chart);
			}
			resolve();
		}, 0);
	});
}

/**
 * Add highlights to all Highcharts asynchronously
 * @param {string|Date} fromtime - Start time of the highlight
 * @param {string|Date} totime - End time of the highlight
 * @returns {Promise} A promise that resolves when all highlights are added
 */
async function addHighlights_in_Highcharts(fromtime, totime) {
	try {
		const chartIds = ['chart_hpcp_hourlydata', 'chart_hpcp_ietd_sum', 'chart_hpcp_ietd_avg'];

		// Process all charts in parallel
		await Promise.all(
			chartIds.map(chartId =>
				processChartAsync(chartId, chart =>
					createHighlight_in_Highcharts(chart, fromtime, totime)
				)
			)
		);

		return true;
	} catch (error) {
		console.error('Error adding highlights:', error);
		return false;
	}
}

/**
 * Remove highlights from all Highcharts asynchronously
 * @returns {Promise} A promise that resolves when all highlights are removed
 */
async function removeHighlights_in_allHighcharts() {
	try {
		const chartIds = ['chart_hpcp_hourlydata', 'chart_hpcp_ietd_sum', 'chart_hpcp_ietd_avg'];

		// Process all charts in parallel
		await Promise.all(
			chartIds.map(chartId =>
				processChartAsync(chartId, chart =>
					removeHighlights_in_Highchart(chart)
				)
			)
		);

		return true;
	} catch (error) {
		console.error('Error removing highlights:', error);
		return false;
	}
}

/**
 * Remove highlight region
 * @param chart
 */
function removeHighlights_in_Highchart(chart)
{
	// Check if the chart object has a reference to the rectangle
	if (!objectIsEmpty(chart.highlight_rectangles))
	{
		if (chart.highlight_rectangles) {
			chart.highlight_rectangles.forEach(function(obj) {
				obj.rect.destroy(); // Remove the rectangle from the chart
			});
			chart.highlight_rectangles = []; // Clear the array
		}
	}
}

/**
 * Redrawing all highlights in the selected Highchart
 * @param chart
 */
function redrawHighlights_in_Highchart(chart)
{
	if (!objectIsEmpty(chart.highlight_rectangles))
	{
		if (chart.highlight_rectangles) {
			chart.highlight_rectangles.forEach(function(obj) {
				// Determine the region to be highlighted
				const xAxis = chart.xAxis[0],
					yAxis = chart.yAxis[0],
					xAxisPos1 = xAxis.toPixels(obj.fromtime), // X position in pixels for region start
					xAxisPos2 = xAxis.toPixels(obj.totime), // X position in pixels for region end
					yAxisPos1 = yAxis.toPixels(yAxis.dataMax), // Y position in pixels for region top
					yAxisPos2 = yAxis.toPixels(yAxis.dataMin), // Y position in pixels for region bottom
					newWidth = xAxisPos2 - xAxisPos1, // Width in pixels
					newHeight = yAxisPos2 - yAxisPos1; // Height in pixels

				obj.rect.attr({
					x: xAxisPos1,
					y: yAxisPos1,
					width: newWidth,
					height: newHeight
				});
			});
		}
	}
}

/**
 * Redrawing all highlights in all Highcharts
 */
function redrawHighlights_in_allHighcharts()
{
	redrawHighlights_in_Highchart(Highcharts.charts.find(c => c.renderTo.id == 'chart_hpcp_hourlydata'));
	redrawHighlights_in_Highchart(Highcharts.charts.find(c => c.renderTo.id == 'chart_hpcp_ietd_sum'));
	redrawHighlights_in_Highchart(Highcharts.charts.find(c => c.renderTo.id == 'chart_hpcp_ietd_avg'));
}

/**
 * Check object is empty
 * @param obj
 * @returns {boolean}
 */
function objectIsEmpty(obj) {
	if (obj == undefined) return false;
	return Object.keys(obj).length === 0 && obj.constructor === Object
}

/**
 *
 * @param begintime
 * @param endtime
 * @constructor
 */
function HichartZooming(begintime, endtime) {
	// Find the chart that has the specific series or characteristics
	const chart = Highcharts.charts.find(c =>
		c && // Check if chart exists
		c.series && // Check if series exists
		c.series.some(series =>
			series.name && // Check if series has a name
			(series.name.includes('HPCP') || series.name.includes('Precipitation'))
		)
	);

	if (!chart) {
		console.warn('Precipitation chart not found');
		return;
	}

	if (begintime == null && endtime == null) {
		// reset zooming
		chart.xAxis[0].setExtremes(null, null);
	} else {
		chart.xAxis[0].setExtremes(
			begintime - MARGINAL_TIMESTAMP,
			endtime + MARGINAL_TIMESTAMP
		);
	}
}

/**
 * Syncing all high charts based on the user's date selection (async version)
 * @param {string} chartClassName The current chart's class name
 * @param {object} e The user's selected data range on the chart
 * @returns {Promise} A promise that resolves when syncing is complete
 */
async function syncZoom(chartClassName, e) {
	syncing = true;

	try {
		// sync all charts - using Promise.all to handle all syncs in parallel
		const syncPromises = [];

		$(Highcharts.charts).each(function(i, chart) {
			if (chart != undefined) {
				if (!chart.container.classList.contains(chartClassName)) {
					const syncPromise = new Promise(resolve => {
						let min = e.min === null ? e.dataMin : e.min;
						let max = e.min === null ? e.dataMax : e.max;

						// Create reset zoom button if it doesn't exist
						if (!isObject(chart.resetZoomButton)) {
							chart.showResetZoom();
						}

						// Use a setTimeout to make it asynchronous and prevent UI blocking
						setTimeout(() => {
							chart.xAxis[0].setExtremes(min, max); // update zoom range
							resolve();
						}, 0);
					});

					syncPromises.push(syncPromise);
				}
			}
		});

		// Wait for all sync operations to complete
		await Promise.all(syncPromises);
	} finally {
		syncing = false;
	}
}

/**
 * Destroying all created highcharts
 */
function removeAllHighCharts()
{
	if (Highcharts.charts.length == 0) return;

	$(Highcharts.charts).each(function(i, chart){
		if (chart !== undefined) {
			chart.destroy();
			chart = undefined;
		}
	});
	Highcharts.charts.splice(0, Highcharts.charts.length);
}

/**
 * Formatting String Date Time to formatted Datetime
 * @param date Date time string with the character "T" inside.
 * @returns {string} Newly formatted date time format
 */
function formatDateTime(date)
{
	const dateString = date.toISOString();
	const dateParts = dateString.split("T");
	const dateTime = dateParts[1].split(".")[0];
	const dateTimeParts = dateTime.split(":");
	const formatted = dateParts[0] + " " + dateTimeParts[0] + ":" + dateTimeParts[1];

	return formatted;
}

/**
 * Formatting Date Range
 * @param series
 * @param tdate
 * @returns {string}
 */
function getDatePeriod(series, tdate)
{
	let fdate = null;
	for (let i = 0; i < series.length; i++) {
		if (series[i].category === tdate) {
			break;
		}
		fdate = series[i].category;
	}

	const toDate = formatDateTime(new Date(tdate));
	const fromDate = formatDateTime(new Date(fdate));

	return fromDate + " ~ " + toDate;
}


/**
 * Custom Axis extension to allow emulation of negative values on a logarithmic
 * Y axis. Note that the scale is not mathematically correct, as a true
 * logarithmic axis never reaches or crosses zero.
 * reference: https://jsfiddle.net/BlackLabel/23gwcadf/
 * @param chartDivId
 * @param title 		Chart title
 * @param titlealign	Title alignment
 * @param subtitle		Chart subtitle if exists (if not an empty string should be)
 * @param label			Name of the data series
 * @param data			The data used in the chart
 * @param globalmax
 */
function createChart(chartDivId, title, titlealign, subtitle, label, data, globalmax= null)
{
	(function (H) {
		H.addEvent(H.Axis, 'afterInit', function () {
			const logarithmic = this.logarithmic;

			if (logarithmic && this.options.custom.allowNegativeLog) {

				// Avoid errors on negative numbers on a log axis
				this.positiveValuesOnly = false;

				// Override the converter functions
				logarithmic.log2lin = num => {
					const isNegative = num < 0;

					let adjustedNum = Math.abs(num);

					if (adjustedNum < 2) {
						adjustedNum += (2 - adjustedNum) / 2;
					}

					const result = Math.log(adjustedNum) / Math.LN2;
					return isNegative ? -result : result;
				};

				logarithmic.lin2log = num => {
					const isNegative = num < 0;

					let result = Math.pow(2, Math.abs(num));
					if (result < 2) {
						result = (2 * (result - 1)) / (2 - 1);
					}
					return isNegative ? -result : result;
				};
			}
		});
	}(Highcharts));


	const chart = Highcharts.chart((chartDivId), {
		// $('#'+chartDivId).highcharts({
		chart: {
			className: chartDivId,
			zoomType: 'x',
			animation: true,	// support animation while zooming
			panning: true,
			panKey: 'shift',
			events: {
				load: function(event) {
					chartLoading--;
					if (chartLoading===0) ($("body")).removeClass("loading"); // hide loading icon

					if (globalmax != null) {
						this.yAxis[0].setExtremes(0, globalmax);
					} else {
						let max = 0;
						const chart = this;
						chart.series.forEach(series => {
							series.points.forEach(point => {
								max = (point.y > max) ? point.y : max;
							});
						});
						this.yAxis[0].setExtremes(0, max);
					}
				}
			},
			resetZoomButton: {
				theme: {
					style: {
						// show resetZoom button
						display: 'block' // block (always show) : none (always hide)
					}
				}
			}
		},
		title: {
			text: title,
			align: titlealign,
			y: 0,
			floating: true,
			style: {
				fontSize: '12px',
			}
		},
		subtitle: {
		    text: subtitle === '' ? '' : subtitle
		},
		xAxis: {
			type: 'datetime',
			events: {
				setExtremes: function (event) {
					if (!syncing) {
						if (g_ZoomingEnabled === false) {
							const chart = this.chart;

							// Clear any existing timeout
							if (chart.zoomDebounceTimer) {
								clearTimeout(chart.zoomDebounceTimer);
								chart.zoomDebounceTimer = null;
							}

							// Show spinner immediately
							showFullPageSpinner();

							// Process zoom action immediately
							processZoomAction(chart, event);
						}

						// Use async IIFE to wait for sync to complete
						(async () => {
							try {
								// Sync all Highcharts
								await syncZoom(chartDivId, event);
							} catch (error) {
								console.error("Error syncing charts:", error);
								// Hide spinner if there's an error
								hideFullPageSpinner();
							}
						})();
					}
				}
			}
		},
		yAxis: {
			type: 'logarithmic',
			// minorTickInterval: 'auto',
			custom: {
				allowNegativeLog: true
			},
			min: 0,
			title: {
				text: 'HPCP (inch)'
			}
		},
		legend: {
			enabled: false
		},
		plotOptions: {
			area: {
				fillColor: {
					linearGradient: {
						x1: 0,
						y1: 0,
						x2: 0,
						y2: 1
					},
					stops: [
						[0, Highcharts.getOptions().colors[0]],
						[1, Highcharts.color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
					]
				},
				marker: {
					radius: 2
				},
				lineWidth: 1,
				states: {
					hover: {
						lineWidth: 1
					}
				},
				threshold: null
			}
		},
		tooltip: {
			formatter: function(tooltip) {
				if (this.y === 0) {
					return false;
				}

				// Use `this.point.series` to access the series
				const seriesData = this.series.data;

				// Define a function to calculate the date period
				const datePeriod = getDatePeriod(seriesData, this.x);

				const header = `<span style="color: blue;">${datePeriod}</span><br/>`;
				return header + tooltip.bodyFormatter(this.points).join('');

			},
			xDateFormat: '%Y-%m-%d  %H:%M:%S',
			shared: true,
			backgroundColor: 'rgba(255, 255, 255, 1)', // Solid white background
			shadow: false, // Remove shadow
			borderRadius: 8, // Optional: if you want rounded corners
			borderWidth: 1, // Add border width
			borderColor: 'black' // Add border color

		},
		series: [{
			type: 'area',
			// trackByArea: true,
			// stickyTracking: false,
			// enableMouseTracking: false,
			name: label,
			data: data
		}],
		credits: {
			enabled: false
		},
		zooming: {
			mouseWheel: true
		}
	});

	// Get initial min and max dates from the data
	const initialMin = data[0][0]; // Assuming first point's x value
	const initialMax = data[data.length - 1][0]; // Assuming last point's x value

	// Add this after chart creation
	chart.container.addEventListener('click', function(e) {
		// Find the reset zoom button
		if (e.target.textContent === 'Reset zoom') {
			// Show full-page spinner immediately when reset zoom is clicked
			showFullPageSpinner();

			// Use async IIFE to handle all async operations
			(async () => {
				try {
					// Make HichartZooming asynchronous
					await new Promise(resolve => {
						setTimeout(() => {
							HichartZooming(null, null);
							resolve();
						}, 0);
					});

					// Reset data on charts (assuming this could be async)
					await new Promise(resolve => {
						setTimeout(() => {
							Zoom_based_UpdateCharts(initialMin, initialMax);
							resolve();
						}, 0);
					});
				} catch (error) {
					console.error("Error during reset zoom:", error);
				} finally {
					// Hide spinner when all processing is complete
					hideFullPageSpinner();
				}
			})();
		}
	});

}