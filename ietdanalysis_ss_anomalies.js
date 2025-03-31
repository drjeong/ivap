/**
 * Anomalies (deviations from the mean/expected values) in precipitation data
 * Requirement: jStat library (<script src="https://cdnjs.cloudflare.com/ajax/libs/jstat/1.9.6/jstat.min.js"></script>)
 * Written by: Dong Hyun Jeong
 *
 */

class AnomalyPlot extends ChartCommons{
    constructor(containerId, IETDhour, IETDData, zScoreThreshold = 2) {
        super(containerId);
        this.containerId = containerId;
        this.IETDhour = IETDhour;
        this.IETDData = IETDData;
        this.zScoreThreshold = zScoreThreshold; // Points with |z-score| >= this value are considered anomalies
        this.margin = { top: 20, right: 20, bottom: 50, left: 60 };
        this.title = "Significant Precipitation Anomalies";

        this.probabilityThreshold = 0.05; // Default 95% confidence level for Gamma and Weibull distributions
        this.distributionType = 'gamma'; // default

        // Configuration
        this.positiveColor = "#e41a1c"; // Light red for positive anomalies
        this.negativeColor = "#e41a1c"; // Light blue for negative anomalies
        this.meanLineColor = "#666666"; // Gray for mean line

        // Bind methods
        this.resize = this.resize.bind(this);
        this.processData = this.processData.bind(this);
        this.timeFormat = this.timeFormat.bind(this);

        // Initialize
        this.processData();
        this.initialize();
    }

    initialize() {
        const container = d3.select(`#${this.containerId}`);
        this.width = parseInt(container.style('width'));
        this.height = parseInt(container.style('height'));
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;

        this.createThresholdSelector();
        this.createDistributionSelector();
        this.createSvg();
        this.createScales();
        this.createAxes();
        this.createVisualization();

        window.addEventListener('resize', this.resize);
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

    processData() {
        if (!Array.isArray(this.IETDData) || this.IETDData.length === 0) {
            console.error('Invalid or empty IETDData');
            return;
        }

        try {
            // First, format the basic data
            const baseData = this.IETDData.map(data => {
                const [datefrom, dateto, volume] = data;
                return {
                    date: new Date(datefrom),
                    volume: volume,
                    from: datefrom,
                    to: dateto,
                    period: `${this.timeFormat(datefrom)} ~ ${this.timeFormat(dateto)}`
                };
            }).sort((a, b) => a.date - b.date);

            const volumes = baseData.map(d => d.volume);

            // Choose distribution type and calculate parameters
            switch(this.distributionType) {
                case 'normal':
                    // Normal distribution
                    this.meanValue = d3.mean(volumes);
                    this.stdDev = d3.deviation(volumes);
                    this.formattedData = baseData.map(d => {
                        const anomaly = d.volume - this.meanValue;
                        const zScore = anomaly / this.stdDev;
                        return {
                            ...d,
                            anomaly: anomaly,
                            zScore: zScore,
                            isSignificant: Math.abs(zScore) >= this.zScoreThreshold
                        };
                    });
                    break;

                case 'gamma':
                    try {
                        // Calculate sample mean and variance
                        const mean = d3.mean(volumes);
                        const variance = d3.variance(volumes);

                        // Method of moments estimators
                        const alpha = Math.pow(mean, 2) / variance;  // Shape parameter (k)
                        const beta = variance / mean;  // Scale parameter (θ)

                        // console.log('Gamma parameters:', {
                        //     shape: alpha,
                        //     scale: beta,
                        //     mean: mean,
                        //     variance: variance
                        // });

                        this.meanValue = alpha * beta; // Expected value for Gamma distribution

                        this.formattedData = baseData.map(d => {
                            const anomaly = d.volume - this.meanValue;

                            // Calculate probability using jStat
                            // jStat.gamma.cdf uses shape (α) and scale (β)
                            const prob = jStat.gamma.cdf(d.volume, alpha, beta);

                            // Check for both tails of the distribution
                            const isSignificant = prob < this.probabilityThreshold / 2 ||
                                prob > (1 - this.probabilityThreshold / 2);

                            // Log extreme values for debugging
                            // if (isSignificant) {
                            //     console.log('Significant value:', {
                            //         volume: d.volume,
                            //         probability: prob,
                            //         threshold: this.probabilityThreshold / 2
                            //     });
                            // }

                            return {
                                ...d,
                                anomaly: anomaly,
                                probability: prob,
                                isSignificant: isSignificant
                            };
                        });

                        // Log summary statistics
                        // console.log('Anomaly detection results:', {
                        //     totalPoints: this.formattedData.length,
                        //     anomalies: this.formattedData.filter(d => d.isSignificant).length,
                        //     probabilityThreshold: this.probabilityThreshold
                        // });

                    } catch (error) {
                        console.error('Error in Gamma processing:', error);
                    }
                    break;

                case 'weibull':
                    try {
                        // Log initial data statistics
                        // console.log('Volume statistics:', {
                        //     min: d3.min(volumes),
                        //     max: d3.max(volumes),
                        //     mean: d3.mean(volumes),
                        //     count: volumes.length
                        // });

                        // Estimate Weibull parameters
                        this.k = this.estimateWeibullShape(volumes);
                        this.lambda = d3.mean(volumes.map(v => Math.pow(v, this.k))) ** (1/this.k);

                        // console.log('Weibull parameters:', {
                        //     shape: this.k,
                        //     scale: this.lambda,
                        //     probabilityThreshold: this.probabilityThreshold
                        // });

                        // Calculate mean
                        this.meanValue = this.lambda * jStat.gammafn(1 + 1/this.k);

                        this.formattedData = baseData.map(d => {
                            const anomaly = d.volume - this.meanValue;
                            const prob = 1 - jStat.weibull.cdf(d.volume, this.k, this.lambda);
                            const isSignificant = prob < this.probabilityThreshold;

                            return {
                                ...d,
                                anomaly: anomaly,
                                probability: prob,
                                isSignificant: isSignificant
                            };
                        });

                        // Log results
                        // console.log('Anomaly detection results:', {
                        //     totalPoints: this.formattedData.length,
                        //     anomalies: this.formattedData.filter(d => d.isSignificant).length,
                        //     probabilityThreshold: this.probabilityThreshold
                        // });

                    } catch (error) {
                        console.error('Error in Weibull processing:', error);
                    }
                    break;

            }

            // Filter for only significant anomalies
            this.significantAnomalies = this.formattedData.filter(d => d.isSignificant);
            this.anomalyPercentage = (this.significantAnomalies.length / this.formattedData.length * 100).toFixed(1);

        } catch (error) {
            console.error('Error processing anomaly data:', error);
            return null;
        }
    }


    // Helper function to estimate Weibull shape parameter
    estimateWeibullShape(data) {
        let k = 1.0;  // Initial guess
        const n = data.length;

        // Ensure no zero or negative values
        if (data.some(v => v <= 0)) {
            console.error("Data contains non-positive values, which are invalid for Weibull estimation.");
            return NaN;
        }

        const sumLnX = d3.sum(data.map(v => Math.log(v)));
        const meanLnX = sumLnX / n;

        // Newton-Raphson Iteration
        for (let i = 0; i < 100; i++) { // Increased iterations for better convergence
            const sumXk = d3.sum(data.map(v => Math.pow(v, k)));
            const sumXkLnX = d3.sum(data.map(v => Math.pow(v, k) * Math.log(v)));

            const f = (sumXkLnX / sumXk) - (1 / k) - meanLnX;

            const sumXkLnX2 = d3.sum(data.map(v => Math.pow(v, k) * Math.pow(Math.log(v), 2)));
            const fprime = (sumXkLnX2 / sumXk) - Math.pow(sumXkLnX / sumXk, 2) + (1 / (k * k));

            const knew = k - f / fprime;

            if (Math.abs(knew - k) < 1e-6) break;
            k = knew;
        }

        return k;
    }

    createDistributionSelector() {
        const selectContainer = d3.select(`#${this.containerId}`)
            .insert("div", "svg")
            .style("position", "absolute")
            .style("left", "15px")
            .style("top", "-8px")
            .style("z-index", "1");

        // Distribution type selector
        const distSelect = selectContainer
            .append("select")
            .style("padding", "1px")
            .style("margin-right", "10px")
            .style("border-radius", "4px")
            .style("font-family", "Arial")
            .style("font-size", "10px");

        distSelect.selectAll("option")
            .data(['normal', 'gamma', 'weibull'])
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d.charAt(0).toUpperCase() + d.slice(1));

        distSelect.property("value", this.distributionType);

        distSelect.on("change", (event) => {
            this.distributionType = event.target.value;
            this.updateThresholdSelectText(); // Add this line
            this.updateData(this.IETDData, this.IETDhour, this.zScoreThreshold);
        });
    }

    createThresholdSelector() {
        // Create container div for the select
        const selectContainer = d3.select(`#${this.containerId}`)
            .insert("div", "svg")
            .style("position", "absolute")
            .style("right", "30px")
            .style("top", "-8px")
            .style("z-index", "1");

        // Create select element
        const select = selectContainer
            .append("select")
            .style("padding", "1px")
            .style("border-radius", "4px")
            .style("font-family", "Arial")
            .style("font-size", "10px");

        // Add options with confidence levels
        select.selectAll("option")
            .data([
                { value: 2, prob: 0.05, conf: 95 },
                { value: 3, prob: 0.01, conf: 99 }
            ])
            .enter()
            .append("option")
            .attr("value", d => d.value)
            .text(d => this.distributionType === 'normal' ?
                `${d.value}σ (${d.conf}%)` :
                `p < ${d.prob} (${d.conf}%)`);

        // Set default value
        select.property("value", this.zScoreThreshold);

        // Add event listener
        select.on("change", (event) => {
            const newThreshold = +event.target.value;
            this.updateData(this.IETDData, this.IETDhour, newThreshold);
        });
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
        this.xScale = d3.scaleTime()
            .domain(d3.extent(this.formattedData, d => d.date))
            .range([0, this.innerWidth]);

        // Update this part to include anomalies
        const maxValue = d3.max(this.formattedData, d => Math.max(d.volume, d.anomaly));
        const minValue = d3.min(this.formattedData, d => Math.min(d.volume, d.anomaly));

        this.yScale = d3.scaleSymlog()
            .domain([Math.min(0, minValue), maxValue])
            .range([this.innerHeight, 0])
            .nice();
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

        this.dedupeLabels(this.svg.select(".x.axis").selectAll(".tick text"));

        this.yAxis = this.svg.append("g")
            .attr("class", "y axis")
            .attr("color", "black")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
            .call(d3.axisLeft(this.yScale)
                .ticks(5)
                .tickFormat(d => d.toFixed(2))); // Remove the + sign since all values are positive

        // Style the y-axis
        this.yAxis
            .select(".domain")  // Main axis line
            .attr("stroke", "black");

        this.yAxis
            .selectAll(".tick line")  // Tick lines specifically
            .attr("stroke", "black")
            .attr("stroke-width", 1);

        this.yAxis
            .selectAll(".tick text")  // Tick text
            .attr("fill", "black");

        // Add zero line
        this.svg.append("line")
            .attr("class", "zero-line")
            .attr("x1", this.margin.left)
            .attr("x2", this.margin.left + this.innerWidth)
            .attr("y1", this.margin.top + this.yScale(0))
            .attr("y2", this.margin.top + this.yScale(0))
            .attr("stroke", this.meanLineColor)
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4,4");
    }

    createVisualization() {

        if (this.distributionType === 'normal') {
            // Normal distribution confidence bands
            const upperBand = this.meanValue + this.stdDev * this.zScoreThreshold;
            const lowerBand = this.meanValue - this.stdDev * this.zScoreThreshold;

            this.svg.append("line")
                .attr("class", "confidence-band upper")
                .attr("x1", this.margin.left)
                .attr("x2", this.margin.left + this.innerWidth)
                .attr("y1", this.margin.top + this.yScale(upperBand))
                .attr("y2", this.margin.top + this.yScale(upperBand))
                .attr("stroke", "#999")
                .attr("stroke-dasharray", "2,2");

            this.svg.append("line")
                .attr("class", "confidence-band lower")
                .attr("x1", this.margin.left)
                .attr("x2", this.margin.left + this.innerWidth)
                .attr("y1", this.margin.top + this.yScale(lowerBand))
                .attr("y2", this.margin.top + this.yScale(lowerBand))
                .attr("stroke", "#999")
                .attr("stroke-dasharray", "2,2");
        } else if (this.distributionType === 'weibull') {
            // Add critical value line for Weibull
            const criticalValue = jStat.weibull.inv(1 - this.probabilityThreshold, this.k, this.lambda);

            this.svg.append("line")
                .attr("class", "confidence-band")
                .attr("x1", this.margin.left)
                .attr("x2", this.margin.left + this.innerWidth)
                .attr("y1", this.margin.top + this.yScale(criticalValue))
                .attr("y2", this.margin.top + this.yScale(criticalValue))
                .attr("stroke", "#999")
                .attr("stroke-dasharray", "2,2");
        }

        // Add mean line
        this.svg.append("line")
            .attr("class", "mean-line")
            .attr("x1", this.margin.left)
            .attr("x2", this.margin.left + this.innerWidth)
            .attr("y1", this.margin.top + this.yScale(this.meanValue))
            .attr("y2", this.margin.top + this.yScale(this.meanValue))
            .attr("stroke", this.meanLineColor)
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4,4");

        // Add points for significant anomalies
        this.points = this.svg.selectAll(".anomaly-point")
            .data(this.significantAnomalies)
            .enter()
            .append("circle")
            .attr("class", "anomaly-point")
            .attr("data-indicator", d => d.period)
            .attr("cx", d => this.margin.left + this.xScale(d.date))
            .attr("cy", d => this.margin.top + this.yScale(d.anomaly))
            .attr("r", 4)  // consistent initial size
            .attr("fill", d => d.volume > this.meanValue ? this.positiveColor : this.negativeColor)
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .on("mouseover", (event, d) => this.handleMouseOver(event, d))
            .on("mouseout", (event, d) => this.handleMouseOut(event, d));

        // Add connecting lines between points
        const lineGenerator = d3.line()
            .x(d => this.margin.left + this.xScale(d.date))
            .y(d => this.margin.top + this.yScale(d.anomaly))
            .curve(d3.curveMonotoneX);

        this.svg.append("path")
            .datum(this.significantAnomalies)
            .attr("class", "anomaly-line")
            .attr("fill", "none")
            .attr("stroke", "#999999")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4,4")
            .attr("d", lineGenerator);

        this.createTitles();
    }


    createTitles() {

        // Update chart title based on distribution type
        let titleText;
        switch(this.distributionType) {
            case 'normal':
                const confLevel = this.zScoreThreshold === 2 ? 95 : 99;
                titleText = `${this.title} (${this.zScoreThreshold}σ, ${confLevel}%)`;
                break;
            case 'gamma':
            case 'weibull':
                const prob = this.probabilityThreshold;
                const conf = (1 - prob) * 100;
                titleText = `${this.title} (p < ${prob}, ${conf}%)`;
                break;
        }

        this.chartTitle = this.svg.append("text")
            .attr("class", "title anomaly")
            .attr("x", this.margin.left + this.innerWidth/2)
            .attr("y", 15)
            .attr('text-anchor', 'middle')
            .attr("font-family", "Arial")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .text(`${titleText}`);

        // Add anomaly percentage
        this.svg.append("text")
            .attr("class", "anomaly-percentage")
            .attr("x", this.innerWidth/2)
            .attr("y", 35)
            .attr('text-anchor', 'middle')
            .attr("font-family", "Arial")
            .attr("font-size", "10px")
            .text(`${this.anomalyPercentage}% of events (${this.significantAnomalies.length} of ${this.formattedData.length})`);

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

    handleMouseOver(event, d) {
        // First, remove any existing highlights
        this.svg.selectAll(".anomaly-point")
            .attr("r", 4)
            .attr("stroke-width", 1)
            .attr("fill", d => d.volume > this.meanValue ? this.positiveColor : this.negativeColor);

        if (typeof addHighlights_in_Highcharts === 'function') {
            addHighlights_in_Highcharts(d.from, d.to);
        }

        if (typeof addHighlightD3Glyphs === 'function') {
            addHighlightD3Glyphs(d.period, "brown");
        }

        let statsText;
        switch(this.distributionType) {
            case 'normal':
                statsText = `Z-Score: ${d.zScore.toFixed(2)}σ`;
                break;
            case 'gamma':
            case 'weibull':
                statsText = `Probability: ${d.probability.toExponential(2)}`;
                break;
        }

        // Get mouse position relative to the chart container
        const mouseX = event.clientX - this.svg.node().getBoundingClientRect().left;

        // Determine if mouse is in right half of chart
        const isRightHalf = mouseX > this.innerWidth / 2;

        // Get tooltip element to calculate its width
        const tooltipNode = this.tooltip.node();
        const tooltipWidth = tooltipNode ? tooltipNode.getBoundingClientRect().width : 150; // 150px as fallback

        this.tooltip
            .html(
                this.createTooltipFormat(d,
                    `<div style="padding: 3px;">
                <span style="color:blue">${d.period}</span><br/>
                Value: ${d.volume.toFixed(2)} inches<br/>
                Mean: ${this.meanValue.toFixed(2)} inches<br/>
                Anomaly: ${d.anomaly >= 0 ? '+' : ''}${d.anomaly.toFixed(2)} inches<br/>
                ${statsText}
            </div>`))
            .style("visibility", "visible")
            .style("top", (event.pageY - 30) + "px")
            .style("left", isRightHalf ?
                (event.pageX - tooltipWidth - 10) + "px" : // Left of cursor if on right half
                (event.pageX + 10) + "px");               // Right of cursor if on left half

        // Highlight only the current point
        d3.select(event.target)
            .raise() // Brings element to front
            .attr("r", 7)
            .attr("stroke-width", 2)
            .attr("fill", "brown");
    }

    handleMouseOut(event, d) {
        if (typeof removeHighlights_in_allHighcharts === 'function') {
            removeHighlights_in_allHighcharts();
        }

        if (typeof removeHighlightD3Glyphs === 'function') {
            removeHighlightD3Glyphs(d.period);
        }

        this.tooltip.style("visibility", "hidden");

        // Reset only the current point
        d3.select(event.target)
            .attr("r", 4)
            .attr("stroke-width", 1)
            .attr("fill", d => d.volume > this.meanValue ? this.positiveColor : this.negativeColor);
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

        // Update threshold lines and zero line
        this.svg.selectAll(".threshold-line, .zero-line")
            .transition()
            .duration(500)
            .attr("x2", this.margin.left + this.innerWidth);

        // Update points
        this.points.transition()
            .duration(500)
            .attr("cx", d => this.margin.left + this.xScale(d.date));

        // Update connecting lines
        const lineGenerator = d3.line()
            .x(d => this.margin.left + this.xScale(d.date))
            .y(d => this.margin.top + this.yScale(d.anomaly))
            .curve(d3.curveMonotoneX);

        this.svg.select(".anomaly-line")
            .transition()
            .duration(500)
            .attr("d", lineGenerator);

        // Update title positions
        this.chartTitle
            .attr("x", this.margin.left + this.innerWidth/2);

        this.svg.select(".anomaly-percentage")
            .attr("x", this.innerWidth/2);
    }

    updateThresholdSelectText() {
        const select = d3.select(`#${this.containerId}`).select("select");
        const thresholdData = [
            { value: 2, prob: 0.05, conf: 95 },
            { value: 3, prob: 0.01, conf: 99 }
        ];

        if (this.distributionType === 'normal') {
            select.selectAll("option")
                .data(thresholdData)
                .text(d => `${d.value}σ (${d.conf}%)`);
        } else {
            select.selectAll("option")
                .data(thresholdData)
                .text(d => `p < ${d.prob} (${d.conf}%)`);
        }
    }


    async updateData(newIETDData, newIETDHour, newZScoreThreshold = null) {
        this.IETDData = newIETDData;
        this.IETDhour = newIETDHour;
        if (newZScoreThreshold !== null) {
            this.zScoreThreshold = newZScoreThreshold;
            // Set probability threshold based on confidence level
            this.probabilityThreshold = newZScoreThreshold === 2 ? 0.05 : 0.01;
        }

        this.processData();
        this.updateThresholdSelectText();
        this.createScales();

        // Remove existing message if any
        this.svg.select(".no-data-message").remove();

        // Check if how many data elements
        if (this.formattedData.length < 50) {
            // Remove all existing elements
            this.svg.selectAll(".zero-line").remove();
            this.svg.selectAll(".anomaly-point")
                .on("mouseover", null)  // Remove event listeners first
                .on("mouseout", null)
                .remove();
            this.svg.selectAll(".anomaly-line").remove();

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

        this.svg.select(".mean-line")
            .transition()
            .duration(750)
            .attr("y1", this.margin.top + this.yScale(this.meanValue))
            .attr("y2", this.margin.top + this.yScale(this.meanValue));

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
                .tickFormat(d => d3.format("+.1f")(d)));

        // Update threshold lines
        this.svg.selectAll(".threshold-line")
            .transition()
            .duration(750)
            .attr("y1", (d, i) => this.margin.top + this.yScale((i === 0 ? 1 : -1) * this.stdDev * this.zScoreThreshold))
            .attr("y2", (d, i) => this.margin.top + this.yScale((i === 0 ? 1 : -1) * this.stdDev * this.zScoreThreshold));

        // Update zero line
        this.svg.select(".zero-line")
            .transition()
            .duration(750)
            .attr("y1", this.margin.top + this.yScale(0))
            .attr("y2", this.margin.top + this.yScale(0));

        // Clear existing points and their event listeners
        this.svg.selectAll(".anomaly-point")
            .on("mouseover", null)
            .on("mouseout", null)
            .remove();

        // Update points with proper D3 enter/update/exit pattern
        const points = this.svg.selectAll(".anomaly-point")
            .data(this.significantAnomalies);

        // Remove old points that no longer have data (EXIT)
        points.exit()
            .on("mouseover", null)
            .on("mouseout", null)
            .remove();

        // Update existing points (UPDATE)
        points
            .transition()
            .duration(750)
            .attr("cx", d => this.margin.left + this.xScale(d.date))
            .attr("cy", d => this.margin.top + this.yScale(d.anomaly))
            .attr("fill", d => d.volume > this.meanValue ? this.positiveColor : this.negativeColor);

        // Add new points (ENTER)
        const enterPoints = points.enter()
            .append("circle")
            .attr("class", "anomaly-point")
            .attr("data-indicator", d => d.period)
            .attr("r", 4)
            .attr("fill", d => d.volume > this.meanValue ? this.positiveColor : this.negativeColor)
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("cx", d => this.margin.left + this.xScale(d.date))
            .attr("cy", d => this.margin.top + this.yScale(d.anomaly));

        // Add event listeners to new points
        enterPoints
            .on("mouseover", (event, d) => this.handleMouseOver(event, d))
            .on("mouseout", (event, d) => this.handleMouseOut(event, d));

        // Merge enter and update selections
        this.points = points.merge(enterPoints);

        // Update connecting lines
        const lineGenerator = d3.line()
            .x(d => this.margin.left + this.xScale(d.date))
            .y(d => this.margin.top + this.yScale(d.anomaly))
            .curve(d3.curveMonotoneX);

        this.svg.select(".anomaly-line")
            .datum(this.significantAnomalies)
            .transition()
            .duration(750)
            .attr("d", lineGenerator);

        // Update titles
        let titleText;
        switch(this.distributionType) {
            case 'normal':
                titleText = `${this.title} (|z| ≥ ${this.zScoreThreshold}σ)`;
                break;
            case 'gamma':
            case 'weibull':
                titleText = `${this.title} (p < ${this.probabilityThreshold})`;
                break;
        }
        this.chartTitle.text(titleText);

        this.svg.select(".anomaly-percentage")
            .text(`${this.anomalyPercentage}% of events (${this.significantAnomalies.length} of ${this.formattedData.length})`);
    }

    // addHighlights(indicator) {
    //     // Reset all points first
    //     this.svg.selectAll("circle.anomaly-point")
    //         .attr("r", 4)
    //         .attr("stroke-width", 1)
    //         .attr("fill", d => d.volume > this.meanValue ? this.positiveColor : this.negativeColor);
    //
    //     // Then highlight only the matching points
    //     this.svg.selectAll("circle.anomaly-point")
    //         .filter(function() {
    //             return (d3.select(this).attr("data-indicator") === indicator);
    //         })
    //         .attr("r", 7)
    //         .attr("stroke-width", 2)
    //         .attr("fill", "brown");
    // }
    //
    // removeHighlights(indicator) {
    //     // Reset only the matching points
    //     this.svg.selectAll("circle.anomaly-point")
    //         .filter(function() {
    //             return (d3.select(this).attr("data-indicator") === indicator);
    //         })
    //         .attr("r", 4)
    //         .attr("stroke-width", 1)
    //         .attr("fill", d => d.volume > this.meanValue ? this.positiveColor : this.negativeColor);
    // }

    // Method to highlight points with a specific indicator
    highlightPoints(indicator) {
        // Reset any previous highlights first
        // this.resetHighlights();

        // Filter points that match the indicator
        this.points.filter(d => d.period === indicator)
            .attr("r", 5)  // Increase radius
            .attr("stroke-width", 1)  // Thicker stroke
            .attr("stroke", "#FFD700")  // Gold stroke (or any color you prefer)
            .raise();  // Bring to front
    }

    // Method to reset all highlights
    resetHighlights() {
        this.points
            .attr("r", 4)  // Return to original radius
            .attr("stroke", "white")  // Original stroke color
            .attr("stroke-width", 1);  // Original stroke width
    }

    addHighlights(indicator) {
        this.highlightPoints(indicator);
    }
    removeHighlights(indicator) {
        this.resetHighlights();
    }

    destroy() {
        try {
            // Remove window event listener
            window.removeEventListener('resize', this.resize);

            // Get container
            const container = d3.select(`#${this.containerId}`);

            // Remove both selectors and their containers
            container.selectAll("select").each(function() {
                // Remove event listeners from selectors
                d3.select(this).on("change", null);
            });

            // Remove selector containers
            container.selectAll("div").remove();

            // Remove SVG and all its child elements
            container.select("svg").remove();

            // Remove tooltip
            if (this.tooltip) {
                this.tooltip.on("mouseover", null)
                    .on("mouseout", null)
                    .remove();
            }

            // Remove specific elements (in case they weren't removed with svg)
            container.selectAll(".anomaly-point").remove();
            container.selectAll(".anomaly-line").remove();
            container.selectAll(".threshold-line").remove();
            container.selectAll(".zero-line").remove();
            container.selectAll(".mean-line").remove();
            container.selectAll(".x.axis").remove();
            container.selectAll(".y.axis").remove();
            container.selectAll(".title").remove();
            container.selectAll(".anomaly-percentage").remove();
            container.selectAll(".no-data-message").remove();

            // Remove all event listeners from points
            container.selectAll(".anomaly-point")
                .on("mouseover", null)
                .on("mouseout", null);

            // Clear all data references
            this.formattedData = null;
            this.significantAnomalies = null;
            this.IETDData = null;
            this.IETDhour = null;
            this.svg = null;
            this.tooltip = null;
            this.xScale = null;
            this.yScale = null;
            this.xAxis = null;
            this.yAxis = null;
            this.points = null;
            this.chartTitle = null;
            this.meanValue = null;
            this.stdDev = null;
            this.zScoreThreshold = null;
            this.width = null;
            this.height = null;
            this.innerWidth = null;
            this.innerHeight = null;
            this.margin = null;
            this.positiveColor = null;
            this.negativeColor = null;
            this.meanLineColor = null;
            this.distributionType = null;
            this.probabilityThreshold = null;
            this.k = null;
            this.lambda = null;

            // Call parent's destroy method
            super.destroy();

        } catch (error) {
            console.error('Error in destroy:', error);
        }
    }
}