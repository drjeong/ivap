class TrendAnalysisPlot extends ChartCommons{
    constructor(containerId, IETDhour, IETDData, IETDHPCPStations, options = {}) {
        super(containerId);
        this.containerId = containerId;
        this.IETDhour = IETDhour;
        this.IETDData = IETDData;
        this.IETDHPCPStations = IETDHPCPStations;
        this.margin = { top: 20, right: 40, bottom: 50, left: 60 };
        this.title = "Trend Analysis";

        // Get container dimensions
        const container = d3.select(`#${this.containerId}`);
        this.width = parseInt(container.style('width'));
        this.height = parseInt(container.style('height'));
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;

        // Trend analysis options with defaults
        this.options = {
            method: 'linear',
            polynomialDegree: 2,
            season: 'all', // Add this line
            ...options
        };

        // Add options
        this.seasons = [
            { id: 'all', label: 'All Seasons' },
            { id: 'spring', label: 'Spring' },
            { id: 'summer', label: 'Summer' },
            { id: 'fall', label: 'Fall' },
            { id: 'winter', label: 'Winter' }
        ];

        // Generate a color scale for stations
        this.colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        this.options.method = 'linear';

        // Store checked state as class property
        this.isChecked = true;

        // Bind methods
        this.resize = this.resize.bind(this);
        this.processData = this.processData.bind(this);
        this.timeFormat = this.timeFormat.bind(this);

        // Initialize
        this.processData();
        this.initialize();
    }

    timeFormat(date) {
        if (!date) return '';
        try {
            const d = new Date(date);
            const month = (d.getMonth() + 1).toString().padStart(2, '0');
            const day = d.getDate().toString().padStart(2, '0');
            const year = d.getFullYear();
            const hour = d.getHours().toString().padStart(2, '0');
            return `${month}/${day}/${year} ${hour}h`;
        } catch (e) {
            return '';
        }
    }

    formatStationInfoTooltip(stationObj) {
        let parts = [];
        parts.push(`ID: ${stationObj.id}`);
        if (stationObj.FAA_ID !== null) {
            parts.push(`FAA: ${stationObj.FAA_ID}`);
        }
        if (stationObj.NCDC_ID !== null) {
            parts.push(`NCDC: ${stationObj.NCDC_ID}`);
        }
        if (stationObj.GHCND_ID !== null) {
            parts.push(`GHCND: ${stationObj.GHCND_ID}`);
        }
        if (stationObj.COOP_ID !== null) {
            parts.push(`COOP: ${stationObj.COOP_ID}`);
        }
        return parts.join('<br>'); // Use line breaks for better readability in tooltip
    }

    processData() {
        try {
            this.formattedData = {};

            // Process data for each station
            Object.entries(this.IETDData).forEach(([station_id, stationData]) => {
                this.formattedData[station_id] = stationData.map(point => {
                    return {
                        date: new Date(point.dateFrom),
                        volume: point.volume,
                        from: point.dateFrom,
                        to: point.dateTo,
                        period: `${this.timeFormat(point.dateFrom)} ~ ${this.timeFormat(point.dateTo)}`,
                        station: station_id
                    };
                }).sort((a, b) => a.date - b.date);
            });

            // Calculate trend lines for each station
            this.trends = {};
            Object.entries(this.formattedData).forEach(([station_id, stationData]) => {
                const xValues = stationData.map(d => d.date.getTime());
                const yValues = stationData.map(d => d.volume);

                const xMean = d3.mean(xValues);
                const yMean = d3.mean(yValues);

                let numerator = 0;
                let denominator = 0;

                for (let i = 0; i < xValues.length; i++) {
                    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
                    denominator += Math.pow(xValues[i] - xMean, 2);
                }

                this.trends[station_id] = {
                    slope: numerator / denominator,
                    intercept: yMean - (numerator / denominator * xMean)
                };
            });

        } catch (error) {
            console.error('Error processing trend data:', error);
            return null;
        }
    }

    initialize() {
        this.createSvg();
        this.createScales();
        this.createAxes();
        this.createScatterPlotToggle();
        this.createVisualization();

        window.addEventListener('resize', this.resize);
    }

    createSvg() {
        d3.select(`#${this.containerId}`).select("svg").remove();

        this.svg = d3.select(`#${this.containerId}`)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height);

        this.tooltip = d3.select("body")
            .append("div")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .attr("font-family", "Arial")
            .style('font-size', '11px')
            .style('color', 'black');
    }

    createScales() {
        // Get all data points across all stations
        const allDataPoints = Object.values(this.formattedData).flat();

        // Find overall min and max dates
        const dateExtent = d3.extent(allDataPoints, d => d.date);

        // Find overall max volume
        const maxVolume = d3.max(allDataPoints, d => d.volume);

        // Create scales using the combined data ranges
        this.xScale = d3.scaleTime()
            .domain(dateExtent)
            .range([0, this.innerWidth]);

        this.yScale = d3.scaleSymlog()
            .domain([0, maxVolume])
            .range([this.innerHeight, 0]);
    }

    dedupeLabels(labels) {
        const rects = [];
        labels.each(function(d, i) {
            const bbox = this.getBoundingClientRect();
            rects.push({
                index: i,
                x: bbox.x,
                y: bbox.y,
                width: bbox.width,
                height: bbox.height,
                element: this,
                visible: true
            });
        });

        rects.sort((a, b) => a.x - b.x);
        let lastVisibleIndex = 0;

        for (let i = 1; i < rects.length; i++) {
            const curr = rects[i];
            const lastVisible = rects[lastVisibleIndex];

            if (lastVisible.x + lastVisible.width + 5 > curr.x) {
                d3.select(curr.element).style("opacity", 0);
                curr.visible = false;
            } else {
                d3.select(curr.element).style("opacity", 1);
                curr.visible = true;
                lastVisibleIndex = i;
            }

            if (!curr.visible) {
                let prevVisibleIndex = lastVisibleIndex;
                for (let j = i - 1; j >= 0; j--) {
                    if (rects[j].visible) {
                        prevVisibleIndex = j;
                        break;
                    }
                }

                if (rects[prevVisibleIndex].x + rects[prevVisibleIndex].width + 5 <= curr.x) {
                    d3.select(curr.element).style("opacity", 1);
                    curr.visible = true;
                    lastVisibleIndex = i;
                }
            }
        }
    }

    createAxes() {
        const xAxis = d3.axisBottom(this.xScale)
            .ticks(d3.timeYear.every(1))
            .tickFormat(d3.timeFormat("%Y"));

        this.xAxis = this.svg.append("g")
            .attr("class", "x axis")
            .attr("color", "black")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top + this.innerHeight})`)
            .call(xAxis);

        // Apply deduping to x-axis labels
        this.dedupeLabels(this.svg.select(".x.axis").selectAll(".tick text"));

        this.yAxis = this.svg.append("g")
            .attr("class", "y axis")
            .attr("color", "black")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
            .call(d3.axisLeft(this.yScale)
                .ticks(5)
                .tickFormat(d => d3.format(".1f")(d)));
    }

    calculateLinearTrend(xValues, yValues) {
        try {
            const n = xValues.length;

            // Calculate means
            const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
            const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;

            // Calculate slope and intercept
            let numerator = 0;
            let denominator = 0;

            for (let i = 0; i < n; i++) {
                numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
                denominator += Math.pow(xValues[i] - xMean, 2);
            }

            const slope = numerator / denominator;
            const intercept = yMean - (slope * xMean);

            // Create prediction function
            const predict = x => {
                try {
                    const result = slope * x + intercept;
                    return isFinite(result) ? result : null;
                } catch {
                    return null;
                }
            };

            // Calculate predicted values and R-squared
            const predictedValues = xValues.map(predict);
            const rSquared = this.calculateRSquared(yValues, predictedValues);

            return {
                type: 'linear',
                slope: slope,
                intercept: intercept,
                predict: predict,
                rSquared: rSquared,
                equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`
            };
        } catch (error) {
            console.error('Error in linear regression:', error);
            return {
                type: 'linear',
                predict: () => null,
                rSquared: 0,
                equation: 'Error in linear fit'
            };
        }
    }

    calculatePolynomialTrend(xValues, yValues, degree) {
        try {
            // Normalize x values to prevent numerical issues
            const xMin = Math.min(...xValues);
            const xMax = Math.max(...xValues);
            const normalizedX = xValues.map(x => (x - xMin) / (xMax - xMin));

            // Create Vandermonde matrix
            const X = [];
            for (let i = 0; i < normalizedX.length; i++) {
                const row = [];
                for (let j = 0; j <= degree; j++) {
                    row.push(Math.pow(normalizedX[i], j));
                }
                X.push(row);
            }

            // Matrix transpose
            const XT = this.transpose(X);

            // Matrix multiplication X'X
            const XTX = this.matrixMultiply(XT, X);

            // Matrix inverse (X'X)^-1
            const XTXInv = this.inverseMatrix(XTX);

            // Matrix multiplication X'y
            const XTy = this.matrixMultiply(XT, yValues.map(y => [y]));

            // Final coefficients
            const coefficients = this.matrixMultiply(XTXInv, XTy).map(row => row[0]);

            // Create prediction function
            const predict = x => {
                try {
                    const xNorm = (x - xMin) / (xMax - xMin);
                    return coefficients.reduce((sum, coef, i) => sum + coef * Math.pow(xNorm, i), 0);
                } catch (error) {
                    return null;
                }
            };

            // Calculate predicted values and R-squared
            const predictedValues = xValues.map(predict);
            const rSquared = this.calculateRSquared(yValues, predictedValues);

            // Create equation string
            const equation = coefficients
                .map((coef, i) => {
                    if (i === 0) return coef.toFixed(4);
                    if (i === 1) return `${coef.toFixed(4)}x`;
                    return `${coef.toFixed(4)}x^${i}`;
                })
                .filter(term => term !== '0.0000')
                .join(' + ')
                .replace(/\+ -/g, '- ');

            return {
                type: 'polynomial',
                coefficients,
                predict,
                rSquared,
                equation: `y = ${equation}`
            };
        } catch (error) {
            console.error('Error in polynomial regression:', error);
            return {
                type: 'polynomial',
                predict: () => null,
                rSquared: 0,
                equation: 'Error in polynomial fit'
            };
        }
    }

// Matrix helper functions
    transpose(matrix) {
        return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
    }

    matrixMultiply(a, b) {
        return a.map(row => {
            return b[0].map((_, j) => {
                return row.reduce((sum, element, i) => {
                    return sum + element * (b[i][j] || b[i]);
                }, 0);
            });
        });
    }

    inverseMatrix(matrix) {
        const n = matrix.length;

        // Create augmented matrix [A|I]
        const augmented = matrix.map((row, i) => [
            ...row,
            ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)
        ]);

        // Gauss-Jordan elimination
        for (let i = 0; i < n; i++) {
            // Find pivot
            let maxRow = i;
            for (let j = i + 1; j < n; j++) {
                if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
                    maxRow = j;
                }
            }

            // Swap maximum row with current row
            if (maxRow !== i) {
                [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
            }

            // Make pivot = 1
            const pivot = augmented[i][i];
            if (Math.abs(pivot) < 1e-10) {
                throw new Error("Matrix is singular");
            }

            for (let j = i; j < 2 * n; j++) {
                augmented[i][j] /= pivot;
            }

            // Eliminate column
            for (let j = 0; j < n; j++) {
                if (i !== j) {
                    const factor = augmented[j][i];
                    for (let k = i; k < 2 * n; k++) {
                        augmented[j][k] -= factor * augmented[i][k];
                    }
                }
            }
        }

        // Extract right half (inverse matrix)
        return augmented.map(row => row.slice(n));
    }

    calculateExponentialTrend(xValues, yValues) {
        try {
            // First normalize timestamps to days from the first date
            const baseTime = Math.min(...xValues);
            const normalizedX = xValues.map(x => (x - baseTime) / (24 * 60 * 60 * 1000)); // Convert to days

            // Filter out non-positive y values and create pairs
            const validPairs = normalizedX.map((x, i) => ({x, y: yValues[i]}))
                .filter(pair => pair.y > 0);

            if (validPairs.length < 2) {
                throw new Error('Insufficient valid data points for exponential regression');
            }

            // Sort pairs by x value to ensure proper trend calculation
            validPairs.sort((a, b) => a.x - b.x);

            const x = validPairs.map(pair => pair.x);
            const y = validPairs.map(pair => pair.y);

            // Find min and max y values for scaling
            const yMin = Math.min(...y);
            const yMax = Math.max(...y);

            // Scale y values to range [1, 10] before taking log
            const scaledY = y.map(val => 1 + 9 * (val - yMin) / (yMax - yMin));
            const lnY = scaledY.map(val => Math.log(val));

            // Perform linear regression on log-transformed data
            const n = x.length;
            const xMean = x.reduce((sum, val) => sum + val, 0) / n;
            const lnYMean = lnY.reduce((sum, val) => sum + val, 0) / n;

            let numerator = 0;
            let denominator = 0;

            for (let i = 0; i < n; i++) {
                numerator += (x[i] - xMean) * (lnY[i] - lnYMean);
                denominator += Math.pow(x[i] - xMean, 2);
            }

            const b = numerator / denominator;
            const lnA = lnYMean - b * xMean;
            const a = Math.exp(lnA);

            // Create prediction function that works with original timestamps
            const predict = timestamp => {
                try {
                    const days = (timestamp - baseTime) / (24 * 60 * 60 * 1000);
                    // Get scaled prediction
                    const scaledPred = a * Math.exp(b * days);
                    // Transform back to original scale
                    const result = yMin + (scaledPred - 1) * (yMax - yMin) / 9;
                    return isFinite(result) ? result : null;
                } catch {
                    return null;
                }
            };

            // Calculate predicted values
            const predictedValues = xValues.map(predict);

            // Calculate R² using original scale values
            const validPredictions = yValues.map((actual, i) => ({
                actual,
                predicted: predictedValues[i]
            })).filter(pair => pair.predicted !== null && pair.actual > 0);

            const rSquared = validPredictions.length >= 2 ?
                this.calculateRSquared(
                    validPredictions.map(p => p.actual),
                    validPredictions.map(p => p.predicted)
                ) : 0;

            // Debug information
            // console.log('Exponential Regression Details:', {
            //     dataPoints: validPredictions.length,
            //     yRange: [yMin, yMax],
            //     coefficients: { a, b },
            //     sampleFit: validPredictions.slice(0, 5).map(p => ({
            //         actual: p.actual,
            //         predicted: p.predicted
            //     })),
            //     rSquared
            // });

            return {
                type: 'exponential',
                a: a,
                b: b,
                predict: predict,
                rSquared: rSquared,
                equation: `y = ${a.toFixed(4)}e^(${b.toFixed(4)}x)`
            };
        } catch (error) {
            console.error('Error in exponential regression:', error);
            return {
                type: 'exponential',
                predict: () => null,
                rSquared: 0,
                equation: 'Error in exponential fit'
            };
        }
    }

    calculateRSquared(actual, predicted) {
        try {
            // Filter out any null, undefined, or NaN values
            const validPairs = actual.map((y, i) => ({actual: y, predicted: predicted[i]}))
                .filter(pair => pair.actual != null && pair.predicted != null &&
                    !isNaN(pair.actual) && !isNaN(pair.predicted));

            if (validPairs.length === 0) return 0;

            const actualValues = validPairs.map(p => p.actual);
            const predictedValues = validPairs.map(p => p.predicted);

            const mean = actualValues.reduce((sum, val) => sum + val, 0) / actualValues.length;

            // Total Sum of Squares
            const totalSS = actualValues.reduce((sum, y) => sum + Math.pow(y - mean, 2), 0);

            // Residual Sum of Squares
            const residualSS = actualValues.reduce((sum, y, i) =>
                sum + Math.pow(y - predictedValues[i], 2), 0);

            const rSquared = 1 - (residualSS / totalSS);

            // If R² is negative, return 0 as it indicates the model is worse than horizontal line
            return Math.max(0, rSquared);
        } catch (error) {
            console.error('Error calculating R-squared:', error);
            return 0;
        }
    }

    // Matrix operations helpers
    transpose(matrix) {
        return matrix[0].map((_, i) => matrix.map(row => row[i]));
    }

    matrixMultiply(a, b) {
        return a.map(row =>
            b[0].map((_, i) =>
                row.reduce((sum, val, j) => sum + val * b[j][i], 0)
            )
        );
    }

    inverseMatrix(matrix) {
        // Simple Gaussian elimination for small matrices
        const n = matrix.length;
        const augmented = matrix.map((row, i) =>
            [...row, ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)]
        );

        for (let i = 0; i < n; i++) {
            const pivot = augmented[i][i];
            for (let j = 0; j < 2 * n; j++) {
                augmented[i][j] /= pivot;
            }

            for (let k = 0; k < n; k++) {
                if (k !== i) {
                    const factor = augmented[k][i];
                    for (let j = 0; j < 2 * n; j++) {
                        augmented[k][j] -= factor * augmented[i][j];
                    }
                }
            }
        }

        return augmented.map(row => row.slice(n));
    }

    getScatterPlotTogglePosition() {
        return `translate(${this.innerWidth - 22}, 0)`;
    }

    createScatterPlotToggle() {
        this.toggleGroup = this.svg.append("g")
            .attr("class", "scatter-plot-toggle")
            .attr('transform', this.getScatterPlotTogglePosition());

        // Create background rectangle
        this.toggleGroup.append("rect")
            .attr("width", 80)  // Adjust width as needed
            .attr("height", 24)
            .attr("fill", "white")
            .attr("stroke", "#ccc")
            .attr("rx", 2)
            .attr("ry", 2)
            .attr("opacity", 0.9);

        // Create checkbox (using a small rectangle)
        const checkbox = this.toggleGroup.append("g")
            .attr("class", "checkbox-group")
            .attr("transform", "translate(10, 12)")
            .style("cursor", "pointer");

        // Store checkbox and checkmark as class properties
        const checkboxRect = checkbox.append("rect")
            .attr("class", "checkbox")
            .attr("width", 6)
            .attr("height", 6)
            .attr("fill", "white")
            .attr("stroke", "#666")
            .attr("opacity", 0.7)
            .attr("y", -4);

        // Store checkmark as class property
        this.checkmark = checkbox.append("path")
            .attr("class", "checkmark")
            .attr("d", "M0,-4 L3,2 L7,-6")
            .attr("stroke", "#666")
            .attr("stroke-width", 1.5)
            .attr("fill", "none");

        // Add label
        checkbox.append("text")
            .attr("x", 14)
            .attr("y", 4)
            .attr("font-family", "Arial")
            .attr("font-size", "10px")
            .text("Trends only");

        // Modified toggle handler with y-axis update
        const toggleVisibility = () => {
            this.isChecked = !this.isChecked;
            this.checkmark.style("display", this.isChecked ? "block" : "none");
            d3.selectAll(".trendanalysis_point")
                .style("display", this.isChecked ? "block" : "none");
            this.updateYAxisScale(this.isChecked);
        };

        // Add click listeners to both checkbox and label
        // Use local checkboxRect variable in event handlers
        checkbox.on("click", toggleVisibility)
            .on("mouseover", function() {
                checkboxRect.attr("opacity", 1);
            })
            .on("mouseout", function() {
                checkboxRect.attr("opacity", 0.7);
            });
    }

    updateYAxisScale(showPoints) {
        let yMin = Infinity;
        let yMax = -Infinity;

        Object.entries(this.formattedData).forEach(([station_id, stationData]) => {
            if (stationData.length >= 2) {
                if (showPoints) {
                    // If points are visible, consider all data points
                    const stationMin = d3.min(stationData, d => d.volume);
                    const stationMax = d3.max(stationData, d => d.volume);
                    yMin = Math.min(yMin, stationMin);
                    yMax = Math.max(yMax, stationMax);
                } else {
                    // If only trend lines are visible, calculate min/max from trend lines
                    const xValues = stationData.map(d => d.date.getTime());
                    const yValues = stationData.map(d => d.volume);

                    let trend;
                    switch(this.options.method) {
                        case 'linear':
                            trend = this.calculateLinearTrend(xValues, yValues);
                            break;
                        case 'polynomial':
                            trend = this.calculatePolynomialTrend(xValues, yValues, this.options.polynomialDegree);
                            break;
                        case 'exponential':
                            trend = this.calculateExponentialTrend(xValues, yValues);
                            break;
                    }

                    if (trend) {
                        // Calculate predicted values for all x points
                        const predictedValues = xValues.map(x => trend.predict(x));
                        const trendMin = d3.min(predictedValues);
                        const trendMax = d3.max(predictedValues);
                        yMin = Math.min(yMin, trendMin);
                        yMax = Math.max(yMax, trendMax);
                    }
                }
            }
        });

        // Add console.log to debug
        // console.log("New y-axis range:", [yMin, yMax]);

        // Update y-scale with new domain
        this.yScale = d3.scaleSymlog()
            .domain([yMin * 0.95, yMax * 1.05])
            .range([this.innerHeight, 0]);

    // Determine appropriate decimal places based on data range
        const range = Math.abs(yMax - yMin);
        let format;
        if (range < 0.1) {
            format = d3.format(".4f");  // Show 4 decimal places for very small ranges
        } else if (range < 1) {
            format = d3.format(".3f");  // Show 3 decimal places for small ranges
        } else if (range < 10) {
            format = d3.format(".2f");  // Show 2 decimal places for medium ranges
        } else {
            format = d3.format(".1f");  // Show 1 decimal place for large ranges
        }

        // Create y-axis with formatted ticks
        const yAxis = d3.axisLeft(this.yScale)
            .ticks(5)
            .tickFormat(format);

        // Update y-axis with animation
        this.svg.select(".y.axis")
            .transition()
            .duration(750)
            .call(yAxis);

        // Handle guidelines
        if (!showPoints) {
            const tickValues = yAxis.scale().ticks(5);

            // Remove existing guide lines
            this.svg.selectAll(".guide-line").remove();

            // Insert a container for guide lines BEFORE the data elements
            const guideLineContainer = this.svg.insert("g", ".trend-line")
                .attr("class", "guide-line-container");

            // Add new guidelines
            guideLineContainer.selectAll(".guide-line")
                .data(tickValues)
                .enter()
                .append("line")
                .attr("class", "guide-line")
                .attr("x1", this.margin.left)
                .attr("x2", this.margin.left + this.innerWidth)
                .attr("y1", d => this.margin.top + this.yScale(d))
                .attr("y2", d => this.margin.top + this.yScale(d))
                .attr("stroke", "#e5e5e5")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "2,2")
                .style("opacity", 0)
                .transition()
                .duration(750)
                .style("opacity", 1);
        } else {
            // Remove guidelines when points are shown
            this.svg.selectAll(".guide-line-container")
                .transition()
                .duration(750)
                .style("opacity", 0)
                .remove();
        }

        // Update trend lines positions
        this.updateTrendLines();

        // Update points positions if they're visible
        if (showPoints) {
            this.updatePoints();
        }
        // Make sure legend stays on top
        this.svg.select(".legend").raise();
    }

    updateTrendLines() {
        Object.entries(this.formattedData).forEach(([station_id, stationData]) => {
            if (stationData.length >= 2) {
                const stationClass = `station-${station_id.replace(/[^a-zA-Z0-9]/g, '_')}`;
                const xValues = stationData.map(d => d.date.getTime());
                const yValues = stationData.map(d => d.volume);

                let trend;
                switch(this.options.method) {
                    case 'linear':
                        trend = this.calculateLinearTrend(xValues, yValues);
                        break;
                    case 'polynomial':
                        trend = this.calculatePolynomialTrend(xValues, yValues, this.options.polynomialDegree);
                        break;
                    case 'exponential':
                        trend = this.calculateExponentialTrend(xValues, yValues);
                        break;
                }

                if (trend) {
                    const lineGenerator = d3.line()
                        .x(d => this.margin.left + this.xScale(d.date))
                        .y(d => this.margin.top + this.yScale(trend.predict(d.date.getTime())));

                    this.svg.select(`.trend-line.${stationClass}`)
                        .transition()
                        .duration(750)
                        .attr("d", lineGenerator(stationData));
                }
            }
        });
    }

    updatePoints() {
        Object.entries(this.formattedData).forEach(([station_id, stationData]) => {
            const stationClass = `station-${station_id.replace(/[^a-zA-Z0-9]/g, '_')}`;
            this.svg.selectAll(`.trendanalysis_point.${stationClass}`)
                .transition()
                .duration(750)
                .attr("cy", d => this.margin.top + this.yScale(d.volume));
        });
    }


    createVisualization() {

        // Draw points and trend lines for each station
        Object.entries(this.formattedData).forEach(([station_id, stationData]) => {
            const stationClass = `station-${station_id.replace(/[^a-zA-Z0-9]/g, '_')}`;

            // Create scatter plot points for this station
            this.svg.selectAll(`.point-${stationClass}`)
                .data(stationData)
                .enter()
                .append("circle")
                .attr("class", `trendanalysis_point ${stationClass}`)
                .attr("data-indicator", d => d.period)
                .attr("cx", d => this.margin.left + this.xScale(d.date))
                .attr("cy", d => this.margin.top + this.yScale(d.volume))
                .attr("r", 3)
                .attr("fill", this.colorScale(station_id))
                .attr("opacity", 0.3);

            // Calculate and draw trend line for this station
            const xValues = stationData.map(d => d.date.getTime());
            const yValues = stationData.map(d => d.volume);

            let trend;
            switch(this.options.method) {
                case 'linear':
                    trend = this.calculateLinearTrend(xValues, yValues);
                    break;
                case 'polynomial':
                    trend = this.calculatePolynomialTrend(xValues, yValues, this.options.polynomialDegree);
                    break;
                case 'exponential':
                    trend = this.calculateExponentialTrend(xValues, yValues);
                    break;
            }

            if (trend) {
                const lineGenerator = d3.line()
                    .x(d => this.margin.left + this.xScale(d.date))
                    .y(d => this.margin.top + this.yScale(trend.predict(d.date.getTime())));

                this.svg.append("path")
                    .datum(stationData)
                    .attr("class", `trend-line ${stationClass}`)
                    .attr("fill", "none")
                    .attr("stroke", this.colorScale(station_id))
                    .attr("stroke-width", 2)
                    .attr("d", lineGenerator);
            }
        });

        // Create method selector
        this.createMethodSelector();

        // Add legend
        const legend = this.svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${this.margin.left + 10}, ${this.margin.top + 10})`);

        Object.keys(this.formattedData).forEach((station_id, i) => {
            const legendItem = legend.append("g")
                .attr("transform", `translate(0, ${i * 20})`);

            legendItem.append("line")
                .attr("x1", 0)
                .attr("x2", 20)
                .attr("stroke", this.colorScale(station_id))
                .attr("stroke-width", 2);

            legendItem.append("text")
                .attr("x", 25)
                .attr("y", 5)
                .text(station_id)
                .attr("font-size", "10px")
                .attr("font-family", "Arial");
        });

        this.createTitles();
        this.updateTrendMethod(this.options.method);
    }

    createMethodSelector() {
        const selectorGroup = this.svg.append("g")
            .attr("class", "method-selector")
            .attr("transform", this.getMethodSelectorPosition()); // Position will be calculated

        // Create background rectangle with minimal padding
        selectorGroup.append("rect")
            .attr("width", 320)  // Width for the selector
            .attr("height", 24)  // Height
            .attr("fill", "white")
            .attr("stroke", "#ccc")
            .attr("rx", 4)
            .attr("ry", 4)
            .attr("opacity", 0.9);

        const methods = [
            { id: 'linear', label: 'Linear Regression' },
            { id: 'polynomial', label: 'Polynomial (deg=2)' },
            { id: 'exponential', label: 'Exponential' }
        ];

        // Create radio buttons and labels horizontally with tight spacing
        const radioGroups = selectorGroup.selectAll("g.radio-group")
            .data(methods)
            .enter()
            .append("g")
            .attr("class", "radio-group")
            .attr("transform", (d, i) => `translate(${10 + i * 120}, 12)`);

        // Add radio buttons
        radioGroups.append("circle")
            .attr("class", "radio-button")
            .attr("r", 4)
            .attr("fill", "white")
            .attr("stroke", "#666")
            .attr("cursor", "pointer")
            .attr("opacity", 0.7)
            .on("mouseover", function() {
                d3.select(this).attr("opacity", 1);
            })
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 0.7);
            })
            .on("click", (event, d) => this.updateTrendMethod(d.id));

        // Add labels
        radioGroups.append("text")
            .attr("x", 10)
            .attr("y", 4)
            .attr("font-family", "Arial")
            .attr("font-size", "10px")
            .attr("cursor", "pointer")
            .text(d => d.label)
            .on("click", (event, d) => this.updateTrendMethod(d.id));

        // Add initial selection
        this.updateRadioButtons(this.options.method);
    }

// Add this helper method to calculate the position
    getMethodSelectorPosition() {
        const rightEdge = this.margin.left + this.innerWidth;
        const xPosition = rightEdge - 320; // 320 is the width of the selector
        const yPosition = this.margin.top + this.innerHeight + 20;
        return `translate(${xPosition}, ${yPosition})`;
    }

// Add this method to update the position when resizing
    updateMethodSelectorPosition() {
        this.svg.select(".method-selector")
            .transition()
            .duration(750)
            .attr("transform", this.getMethodSelectorPosition());
    }

    updateRadioButtons(selectedMethod) {
        this.svg.selectAll(".radio-button")
            .attr("fill", d => d.id === selectedMethod ? "#666" : "white");
    }

    updateTrendMethod(newMethod) {
        this.options.method = newMethod;
        this.updateRadioButtons(newMethod);

        // Remove existing trend lines and R² text
        this.svg.selectAll(".trend-line").remove();
        this.svg.selectAll(".stats-container").remove();

        // Store statistics for each station
        const stationStats = {};

        // Calculate and draw new trend lines for each station
        Object.entries(this.formattedData).forEach(([station_id, stationData]) => {
            if (stationData.length >= 2) {
                const xValues = stationData.map(d => d.date.getTime());
                const yValues = stationData.map(d => d.volume);
                const stationClass = `station-${station_id.replace(/[^a-zA-Z0-9]/g, '_')}`;

                let trend;
                switch(newMethod) {
                    case 'linear':
                        trend = this.calculateLinearTrend(xValues, yValues);
                        break;
                    case 'polynomial':
                        trend = this.calculatePolynomialTrend(xValues, yValues, this.options.polynomialDegree);
                        break;
                    case 'exponential':
                        trend = this.calculateExponentialTrend(xValues, yValues);
                        break;
                }

                if (trend) {
                    const mkResult = this.calculateMannKendall(yValues);
                    const lineGenerator = d3.line()
                        .x(d => this.margin.left + this.xScale(d.date))
                        .y(d => this.margin.top + this.yScale(trend.predict(d.date.getTime())));

                    this.svg.append("path")
                        .datum(stationData)
                        .attr("class", `trend-line ${stationClass}`)
                        .attr("fill", "none")
                        .attr("stroke", this.colorScale(station_id))
                        .attr("stroke-width", 2)
                        .attr("d", lineGenerator);

                    // Store statistics for this station
                    stationStats[station_id] = { trend, mkResult };
                }
            }
        });

        // Update legend with statistics
        this.updateLegendWithStats(stationStats);

        this.updateYAxisScale(this.isChecked);
    }

    updateLegendWithStats(stationStats) {
        // Clear existing legend
        const legend = this.svg.select(".legend");
        legend.selectAll("*").remove();

        // Recreate legend with statistics
        Object.keys(this.formattedData).forEach((station_id, i) => {
            const stats = stationStats[station_id];
            const legendItem = legend.append("g")
                .attr("transform", `translate(0, ${i * 20})`);

            // Line
            legendItem.append("line")
                .attr("x1", 0)
                .attr("x2", 20)
                .attr("stroke", this.colorScale(station_id))
                .attr("stroke-width", 2);

            const stationObj = this.IETDHPCPStations[station_id];
            const station_title = `${stationObj.name} [${stationObj.id}]`;

            // Station name
            legendItem.append("text")
                .attr("x", 25)
                .attr("y", 5)
                .text(`${station_title}`)
                .attr("font-size", "10px")
                .attr("font-family", "Arial")
                .style("cursor", "pointer")
                .on("mouseover", (event) => {
                    const tooltip = document.getElementById('d3-style-tooltip');

                    // Get the station's tooltip text (replace this with your actual tooltip content)
                    const tooltiptext = this.formatStationInfoTooltip(stationObj);

                    tooltip.innerHTML = `
                        <div style="border-bottom: 1px solid rgba(255,255,255,0.3); margin-bottom: 5px; padding-bottom: 5px">
                            <strong>${station_title}</strong>
                        </div>
                        ${tooltiptext}
                    `;

                    const tooltipWidth = tooltip.offsetWidth;
                    const tooltipHeight = tooltip.offsetHeight;

                    let left = event.clientX + window.scrollX + 10;
                    let top = event.clientY + window.scrollY - tooltipHeight - 10;

                    if (left + tooltipWidth > window.innerWidth) {
                        left = event.clientX + window.scrollX - tooltipWidth - 10;
                    }
                    if (top < window.scrollY) {
                        top = event.clientY + window.scrollY + 10;
                    }

                    tooltip.style.left = left + 'px';
                    tooltip.style.top = top + 'px';
                    tooltip.style.opacity = '1';
                })
                .on("mouseout", () => {
                    const tooltip = document.getElementById('d3-style-tooltip');
                    tooltip.style.opacity = '0';
                })
                .on("mousemove", (event) => {
                    const tooltip = document.getElementById('d3-style-tooltip');

                    const tooltipWidth = tooltip.offsetWidth;
                    const tooltipHeight = tooltip.offsetHeight;

                    let left = event.clientX + window.scrollX + 10;
                    let top = event.clientY + window.scrollY - tooltipHeight - 10;

                    if (left + tooltipWidth > window.innerWidth) {
                        left = event.clientX + window.scrollX - tooltipWidth - 10;
                    }
                    if (top < window.scrollY) {
                        top = event.clientY + window.scrollY + 10;
                    }

                    tooltip.style.left = left + 'px';
                    tooltip.style.top = top + 'px';
                });

            // Statistics in LaTeX using foreignObject
            if (stats) {
                const statsContainer = legendItem.append("foreignObject")
                    .attr("x", 25 + this.getTextWidth(`${station_title}`, "10px Arial") + 5) // Position after station name
                    .attr("y", -7) // Adjust to align with station name
                    .attr("width", 300)
                    .attr("height", 20)
                    .attr("color", "black")
                    .append("xhtml:div")
                    .style("font-size", "12px");

                statsContainer.html(
                    `\\(\\small{(R^2=${stats.trend.rSquared.toFixed(3)},\\, p=${stats.mkResult.pValue.toFixed(4)},\\, \\tau=${stats.mkResult.tau.toFixed(3)})}\\)`
                );

                // Render LaTeX
                if (window.MathJax) {
                    MathJax.typesetPromise([statsContainer.node()]).catch((err) => console.log('MathJax error:', err));
                }
            }
        });
    }

    // Helper function to calculate text width
    getTextWidth(text, font) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = font;
        return context.measureText(text).width;
    }

    // Add to your class
    calculateMannKendall(values) {
        let S = 0;
        let n = values.length;

        // Calculate S statistic
        for(let i = 0; i < n-1; i++) {
            for(let j = i+1; j < n; j++) {
                S += Math.sign(values[j] - values[i]);
            }
        }

        // Calculate variance
        let variance = (n * (n-1) * (2*n + 5)) / 18;

        // Calculate Z score
        let Z = (S > 0 ? S-1 : S+1) / Math.sqrt(variance);

        // Calculate p-value using jStat (two-tailed test)
        let pValue = 2 * (1 - jStat.normal.cdf(Math.abs(Z), 0, 1));

        return {
            S: S,
            Z: Z,
            pValue: pValue,
            tau: S / (n * (n-1) / 2)
        };
    }

    createTitles() {
        this.chartTitle = this.svg.append("text")
            .attr("class", "title trend-analysis")
            .attr("x", this.margin.left + this.innerWidth/2)
            .attr("y", 15)
            .attr('text-anchor', 'middle')
            .attr("font-family", "Arial")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .text(this.title);

        // Y-axis label
        this.svg.append('g')
            .attr('transform', `translate(${this.margin.left * 1/5}, ${this.innerHeight/2})`)
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr("font-size", "12px")
            .text('HPCP (inch)')
            .attr("font-family", "Arial");
    }

    resize() {
        // Check if the container is visible
        if (!this.isVisible()) return;

        // Update dimensions
        const container = d3.select(`#${this.containerId}`);
        this.width = parseInt(container.style('width'));
        this.innerWidth = this.width - this.margin.left - this.margin.right;

        // Update SVG width
        this.svg.attr("width", this.width);

        // Update scales
        this.xScale.range([0, this.innerWidth]);

        // Update axes
        this.svg.select(".x.axis")
            .transition()
            .duration(500)
            .call(d3.axisBottom(this.xScale)
                .ticks(d3.timeYear.every(1))
                .tickFormat(d3.timeFormat("%Y")))
            .on("end", () => {
                this.dedupeLabels(this.svg.select(".x.axis").selectAll(".tick text"));
            });

        // Update points for each station
        Object.entries(this.formattedData).forEach(([station_id, stationData]) => {
            const stationClass = `station-${station_id.replace(/[^a-zA-Z0-9]/g, '_')}`;
            this.svg.selectAll(`.trendanalysis_point.${stationClass}`)
                .transition()
                .duration(500)
                .attr("cx", d => this.margin.left + this.xScale(d.date));
        });

        // Remove existing trend lines
        this.svg.selectAll(".trend-line").remove();

        // Recalculate trend lines for each station
        Object.entries(this.formattedData).forEach(([station_id, stationData]) => {
            if (stationData.length >= 2) {
                const xValues = stationData.map(d => d.date.getTime());
                const yValues = stationData.map(d => d.volume);
                const stationClass = `station-${station_id.replace(/[^a-zA-Z0-9]/g, '_')}`;

                let trend;
                switch(this.options.method) {
                    case 'linear':
                        trend = this.calculateLinearTrend(xValues, yValues);
                        break;
                    case 'polynomial':
                        trend = this.calculatePolynomialTrend(xValues, yValues, this.options.polynomialDegree);
                        break;
                    case 'exponential':
                        trend = this.calculateExponentialTrend(xValues, yValues);
                        break;
                }

                if (trend) {
                    // Draw trend line
                    const lineGenerator = d3.line()
                        .x(d => this.margin.left + this.xScale(d.date))
                        .y(d => this.margin.top + this.yScale(trend.predict(d.date.getTime())));

                    this.svg.append("path")
                        .datum(stationData)
                        .attr("class", `trend-line ${stationClass}`)
                        .attr("fill", "none")
                        .attr("stroke", this.colorScale(station_id))
                        .attr("stroke-width", 2)
                        .attr("d", lineGenerator);
                }
            }
        });

        // Update title position
        this.chartTitle
            .attr("x", this.margin.left + this.innerWidth/2);

        // Update method selector position
        this.updateMethodSelectorPosition();

        if (!this.svg.selectAll(".guide-line").empty()) {
            // Update existing guidelines with new x2 value
            this.svg.selectAll(".guide-line")
                .attr("x2", this.margin.left + this.innerWidth);
        }

        // Update R-squared text position
        if (this.rSquaredText) {
            this.rSquaredText.attr("x", this.margin.left * 1/5);
        }

        // Update scatter plot toggle position
        if (this.toggleGroup) {
            this.toggleGroup.attr('transform', this.getScatterPlotTogglePosition());
        }
    }

    async updateData(newIETDData, newIETDHour) {
        this.IETDData = newIETDData;
        this.IETDhour = newIETDHour;

        this.processData();

        // Reset scatter plot toggle to checked state
        if (this.checkmark && this.isChecked !== true) {
            this.isChecked = true;
            this.checkmark.style("display", "block");
            d3.selectAll(".trendanalysis_point")
                .style("display", "block");
            this.updateYAxisScale(this.isChecked);
        }

        // Update scales with all seasonal data points
        const allDataPoints = Object.values(this.formattedData).flat();
        this.xScale.domain(d3.extent(allDataPoints, d => d.date));
        this.yScale.domain([0, d3.max(allDataPoints, d => d.volume)]);

        this.svg.select(".no-data-message").remove();

        // Check if enough data elements (checking total points across all stations)
        if (allDataPoints.length < 50) {
            // Remove existing elements
            this.svg.selectAll(".trendanalysis_point").remove();
            this.svg.selectAll(".trend-line").remove();
            this.svg.selectAll(".legend").remove();

            // Add message in the middle of the chart
            this.svg.append("text")
                .attr("class", "no-data-message")
                .attr("x", this.innerWidth / 2)
                .attr("y", this.innerHeight / 2)
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .style("font-size", "14px")
                .style("fill", "#666")
                .text("Not enough data!");

            return;
        }

        // Update axes
        this.svg.select(".x.axis")
            .transition()
            .duration(750)
            .call(d3.axisBottom(this.xScale)
                .ticks(d3.timeYear.every(1))
                .tickFormat(d3.timeFormat("%Y")))
            .on("end", () => {
                this.dedupeLabels(this.svg.select(".x.axis").selectAll(".tick text"));
            });

        this.svg.select(".y.axis")
            .transition()
            .duration(750)
            .call(d3.axisLeft(this.yScale).ticks(5)
                .tickFormat(d => d3.format("")(d)));

        // Update points for each station
        // Update points for each station
        Object.entries(this.formattedData).forEach(([station_id, stationData]) => {
            const stationClass = `station-${station_id.replace(/[^a-zA-Z0-9]/g, '_')}`;

            // First remove all existing points for this station
            this.svg.selectAll(`.trendanalysis_point.${stationClass}`).remove();

            // Create new points
            this.svg.selectAll(`.point-${stationClass}`)
                .data(stationData)
                .enter()
                .append("circle")
                .attr("class", `trendanalysis_point ${stationClass}`)
                .attr("data-indicator", d => d.period)
                .attr("cx", d => this.margin.left + this.xScale(d.date))
                .attr("cy", d => this.margin.top + this.yScale(d.volume))
                .attr("r", 3)
                .attr("fill", this.colorScale(station_id))
                .attr("opacity", 0.6);
        });

        // Remove existing trend lines
        this.svg.selectAll(".trend-line").remove();

        // Update trend lines for each station using seasonal data
        this.updateTrendMethod(this.options.method);

        // Update title
        this.updateTitle();

        // Update season selector if it exists
        const seasonSelect = d3.select(`#${this.containerId}`).select(".season-select");
        if (!seasonSelect.empty()) {
            seasonSelect.property("value", currentSeason);
        }
    }

    updateTitle() {
        if (this.options.season === 'all') {
            this.chartTitle.text(this.title);
        }
        else {
            const season = this.seasons.find(s => s.id === this.options.season);
            this.chartTitle.text(this.title + ' (' + (season ? season.label : '') + ')');
        }
    }


    addHighlights(indicator) {
        // Select circles with a specific data-indicator value
        const selectedPoints = this.svg.selectAll("circle.trendanalysis_point")
            .filter(function() {
                return (d3.select(this).attr("data-indicator") === indicator);
            });

        // Apply styling to all matching circles
        selectedPoints
            .attr("r", 6)
            .attr("stroke-width", 2)
            .attr("fill", "brown");
    }

    removeHighlights(indicator) {
        const selectedPoints = this.svg.selectAll("circle.trendanalysis_point")
            .filter(function() {
                return (d3.select(this).attr("fill") === "brown");
            });

        selectedPoints
            .attr("r", 3)
            .attr("stroke-width", 1)
            .attr("fill", "steelblue");
    }

    destroy() {
        try {
            // Remove window event listener
            window.removeEventListener('resize', this.resize);

            // Get container
            const container = d3.select(`#${this.containerId}`);

            // Remove all SVG elements
            container.select("svg").remove();

            // Remove tooltip
            if (this.tooltip) {
                this.tooltip.remove();
                this.tooltip = null;
            }

            // Remove season selector
            container.select(".season-selector-container").remove();

            // Remove all specific elements
            container.selectAll(".trendanalysis_point").remove();
            container.selectAll(".trend-line").remove();
            container.selectAll(".method-selector").remove();
            container.selectAll(".season-selector").remove();
            container.selectAll(".radio-group").remove();
            container.selectAll(".stats-container").remove();
            container.selectAll(".y.axis").remove();
            container.selectAll(".title").remove();
            container.selectAll(".trend-analysis").remove();
            container.selectAll(".no-data-message").remove();

            // Remove all event listeners
            container.selectAll(".trendanalysis_point")
                .on("mouseover", null)
                .on("mouseout", null);

            container.selectAll(".radio-button")
                .on("mouseover", null)
                .on("mouseout", null)
                .on("click", null);

            container.selectAll(".season-select")
                .on("change", null);

            // Clear all data references
            this.IETDData = null;
            this.IETDhour = null;
            this.formattedData = null;
            this.svg = null;
            this.tooltip = null;
            this.xScale = null;
            this.yScale = null;
            this.xAxis = null;
            this.yAxis = null;
            this.points = null;
            this.trendLine = null;
            this.chartTitle = null;
            this.rSquaredText = null;
            this.trends = null;
            this.currentTrend = null;
            this.slope = null;
            this.intercept = null;

            // Clear options and colors
            this.options = null;
            this.colorScale = null;

            // Clear dimensions
            this.width = null;
            this.height = null;
            this.innerWidth = null;
            this.innerHeight = null;
            this.margin = null;

            // Clear bound methods
            this.resize = null;
            this.processData = null;
            this.timeFormat = null;
            this.updateSeason = null;
            this.updateTrendMethod = null;
            this.dedupeLabels = null;

            // Clear calculation methods
            this.calculateLinearTrend = null;
            this.calculatePolynomialTrend = null;
            this.calculateExponentialTrend = null;
            this.calculateRSquared = null;


            // Clear matrix operation helpers
            this.transpose = null;
            this.matrixMultiply = null;
            this.inverseMatrix = null;

            // Clear the container reference
            this.containerId = null;

            // Call parent's destroy method
            super.destroy();

            // Force garbage collection (if supported)
            if (window.gc) {
                window.gc();
            }

        } catch (error) {
            console.error('Error in destroy:', error);
        }
    }
}