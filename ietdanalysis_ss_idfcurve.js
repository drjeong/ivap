class IDFCurvePlot extends ChartCommons{
    constructor(containerId, rawHPCPData, IETDhour) {
        super(containerId);
        this.containerId = containerId;
        this.rawData = rawHPCPData;
        this.IETDhour = IETDhour;
        this.margin = { top: 20, right: 20, bottom: 50, left: 60 };
        this.title = "Intensity-Duration-Frequency (IDF) Curves";
        this.durations = [1, 2, 3, 6, 12, 24, 48, 96, 196, 384];
        this.hasZeroDuration = false;

        // Define colors for all return periods
        this.lineColors = {
            year2: "#8884d8",
            year5: "#82ca9d",
            year10: "#ffc658",
            year25: "#ff7f0e",
            year50: "#d62728",
            year100: "#1f77b4"
        };
        //
        // this.legendData = [
        //     "2-year (Minor Storms)",
        //     "5-year (Urban Drainage)",
        //     "10-year (Moderate Infrastructure)",
        //     "25-year (Major Drainage)",
        //     "50-year (Critical Infrastructure)",
        //     "100-year (Extreme Events)"
        // ];

        this.legendData = [
            "2-years",
            "5-years",
            "10-years",
            "25-years",
            "50-years",
            "100-years"
        ];

        // Bind methods
        this.resize = this.resize.bind(this);
        this.mousemove = this.mousemove.bind(this);
        this.calculateIDFCurves = this.calculateIDFCurves.bind(this);

        // Initialize
        this.initialize();
    }

    calculateIDFCurves(data) {
        return this.durations.map(duration => {
            if (duration > data.length) {
                return {
                    duration: duration,
                    year2: 0, year5: 0, year10: 0, year25: 0, year50: 0, year100: 0
                };
            }

            const intensities = [];
            for (let i = 0; i <= data.length - duration; i++) {
                let sum = 0;
                for (let j = 0; j < duration; j++) {
                    if (data[i + j] && typeof data[i + j][2] === 'number') {
                        sum += data[i + j][2];
                    }
                }
                intensities.push(sum);
            }

            const sortedIntensities = intensities.slice().sort((a, b) => b - a);
            const n = sortedIntensities.length;

            const getReturnValue = (T) => {
                const rank = Math.ceil((n + 1) / T);
                const value = sortedIntensities[Math.min(Math.max(0, rank - 1), n - 1)] || 0;
                return value / duration;
            };

            return {
                duration: duration,
                year2: getReturnValue(2),
                year5: getReturnValue(5),
                year10: getReturnValue(10),
                year25: getReturnValue(25),
                year50: getReturnValue(50),
                year100: getReturnValue(100)
            };
        });
    }

    initialize() {
        // Get container dimensions
        const container = d3.select(`#${this.containerId}`);
        this.width = parseInt(container.style('width'));
        this.height = parseInt(container.style('height'));
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;

        // Calculate IDF curve data
        this.idfData = this.calculateIDFCurves(this.rawData);

        // Create SVG
        this.createSvg();

        // Create scales and axes
        this.createScales();
        this.createAxes();

        // Create the visualization
        this.createVisualization();

        // Add resize listener
        this.debouncedResize = this.debounce(this.resize, 250);
        window.addEventListener('resize', this.debouncedResize);
    }

    createSvg() {
        // Clear existing SVG
        d3.select(`#${this.containerId}`).select("svg").remove();

        // Create new SVG
        this.svg = d3.select(`#${this.containerId}`)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
    }

    createScales() {
        this.xScale = d3.scaleLog()
            .domain([d3.min(this.idfData, d => d.duration), d3.max(this.idfData, d => d.duration)])
            .range([0, this.innerWidth])
            .base(10);

        this.yScale = d3.scaleLog()
            .domain([
                d3.min(this.idfData, d => Math.min(d.year2, d.year5, d.year10, d.year25, d.year50, d.year100)),
                d3.max(this.idfData, d => Math.max(d.year2, d.year5, d.year10, d.year25, d.year50, d.year100))
            ])
            .range([this.innerHeight, 0]);

        this.lineGenerators = {
            year2: d3.line().x(d => this.xScale(d.duration)).y(d => this.yScale(d.year2)),
            year5: d3.line().x(d => this.xScale(d.duration)).y(d => this.yScale(d.year5)),
            year10: d3.line().x(d => this.xScale(d.duration)).y(d => this.yScale(d.year10)),
            year25: d3.line().x(d => this.xScale(d.duration)).y(d => this.yScale(d.year25)),
            year50: d3.line().x(d => this.xScale(d.duration)).y(d => this.yScale(d.year50)),
            year100: d3.line().x(d => this.xScale(d.duration)).y(d => this.yScale(d.year100))
        };
    }

    createAxes() {
        this.xAxis = this.svg.append("g")
            .attr("color", "black")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${this.innerHeight})`)
            .call(d3.axisBottom(this.xScale)
                .tickValues(this.durations)
                .tickFormat(d => `${d3.format(".0f")(d)}h`));

        this.yAxis = this.svg.append("g")
            .attr("color", "black")
            .attr("class", "y-axis")
            .call(d3.axisLeft(this.yScale)
                .tickValues(this.yScale.ticks(5).filter((d, i) => i % 2 === 0))
                .tickFormat(d => d3.format(".2f")(d)));
    }

    createVisualization() {
        // Add lines
        Object.entries(this.lineGenerators).forEach(([period, lineGenerator]) => {
            this.svg.append("path")
                .datum(this.idfData)
                .attr("class", `line ${period}`)
                .style("stroke", this.lineColors[period])
                .style("fill", "none")
                .attr("d", lineGenerator);
        });

        // Add labels
        this.addLabels();

        // Add legend
        this.addLegend();

        // Add tooltip and hover functionality
        this.createTooltip();
        this.addHoverFunctionality();
    }

    addLabels() {
        // Y-axis label
        this.svg.append('g')
            .attr('transform', `translate(${this.margin.left * 1/5}, ${this.innerHeight/2})`)
            .append("text")
            .attr("class", "y label")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("y", -60)
            .attr("font-size", "12px")
            .text("HPCP (inch/hr)")
            .attr("font-family", "Arial");

        // Title
        this.svg.append("text")
            .attr("class", "title idfcurve")
            .attr("x", this.innerWidth/2)
            .attr("y", 0)
            .attr('text-anchor', 'middle')
            .attr("font-family", "Arial")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .text(this.title);
    }

    addLegend() {
        const legendWidth = this.legendData.reduce((acc, curr) => acc + curr.length * 6 + 30, 0);
        const legendStartX = (this.innerWidth - legendWidth) / 2;

        const legend = this.svg.append("g")
            .attr("font-family", "Arial")
            .attr("font-size", "10px")
            .attr("text-anchor", "start")
            .attr("transform", `translate(${legendStartX}, ${-5})`);

        this.legendData.forEach((label, i) => {
            const period = `year${[2,5,10,25,50,100][i]}`;
            const previousWidth = this.legendData
                .slice(0, i)
                .reduce((acc, curr) => acc + curr.length * 6 + 30, 0);

            const legendItem = legend.append("g")
                .attr("transform", `translate(${previousWidth}, ${this.margin.top + this.margin.bottom/2 + this.innerHeight})`);

            legendItem.append("line")
                .attr("x1", 0)
                .attr("x2", 19)
                .attr("y1", -2.5)
                .attr("y2", -2.5)
                .attr("stroke", this.lineColors[period]);

            legendItem.append("text")
                .attr("x", 24)
                .attr("y", -2.5)
                .attr("dy", "0.32em")
                .text(label);
        });
    }

    createTooltip() {
        this.tooltip = d3.select("body")
            .append("div")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .attr("font-family", "Arial")
            .style('font-size', '11px')
            .style('color', 'black');
    }

    addHoverFunctionality() {
        this.focus = this.svg.append("g")
            .style("display", "none");

        this.focus.append("circle")
            .attr("r", 5)
            .style("fill", "none")
            .style("stroke", "#000")
            .style("stroke-width", 2);

        this.svg.append("rect")
            .attr("class", "overlay")
            .attr("width", this.innerWidth)
            .attr("height", this.innerHeight)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", () => {
                if (this.hasZeroDuration)
                    return;
                this.focus.style("display", null);
                this.tooltip.style("visibility", "visible");
            })
            .on("mouseout", () => {
                if (this.hasZeroDuration)
                    return;
                this.focus.style("display", "none");
                this.tooltip.style("visibility", "hidden");
                this.tooltip.style("opacity", 0);
            })
            .on("mousemove", this.mousemove);
    }

    mousemove(event) {
        if (this.hasZeroDuration)
            return;

        const x0 = this.xScale.invert(d3.pointer(event)[0]);
        const i = d3.bisector(d => d.duration).left(this.idfData, x0);
        const d = this.idfData[i];

        if (d) {
            // Update focus point position for all return periods
            const mouseX = this.xScale(d.duration);
            if (isNaN(mouseX)) return; // Validate mouseX

            // Find closest line to mouse Y position
            const mouseY = d3.pointer(event)[1];
            const returnPeriods = ['year2', 'year5', 'year10', 'year25', 'year50', 'year100'];
            const distances = returnPeriods.map(period => {
                const value = d[period];
                if (value === undefined || value === null || isNaN(value)) return Infinity;
                const lineY = this.yScale(value);
                if (isNaN(lineY)) return Infinity;
                return Math.abs(mouseY - lineY);
            });

            const minDistance = Math.min(...distances);
            if (minDistance === Infinity) return; // No valid points found

            const closestPeriodIndex = distances.indexOf(minDistance);
            const closestPeriod = returnPeriods[closestPeriodIndex];

            const yValue = this.yScale(d[closestPeriod]);
            if (isNaN(yValue)) return; // Validate y value

            // Update focus point position
            this.focus.attr("transform",
                `translate(${mouseX},${yValue})`);

            // Update focus point color to match the line
            this.focus.select("circle")
                .style("stroke", this.lineColors[closestPeriod]);

            // Tooltip positioning
            const graphContainer = d3.select(event.currentTarget).node().getBoundingClientRect();
            const tooltipElement = this.tooltip.node();
            const tooltipRect = tooltipElement.getBoundingClientRect();

            const highlightedY = this.yScale(d[closestPeriod]);
            const centerY = graphContainer.top + highlightedY - tooltipRect.height - 10;

            let leftPos = event.pageX + 5;
            if (leftPos + tooltipRect.width > graphContainer.right) {
                leftPos = event.pageX - tooltipRect.width - 5;
            }

            // this.tooltip.html(`
            // <div style="padding: 3px; border-radius: 8px; box-shadow:0 10px 16px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19) !important;">
            //     Duration: ${d.duration.toFixed(1)} hrs<br/>
            //     2-year: ${d.year2.toFixed(2)} in/hr<br/>
            //     5-year: ${d.year5.toFixed(2)} in/hr<br/>
            //     10-year: ${d.year10.toFixed(2)} in/hr<br/>
            //     25-year: ${d.year25.toFixed(2)} in/hr<br/>
            //     50-year: ${d.year50.toFixed(2)} in/hr<br/>
            //     100-year: ${d.year100.toFixed(2)} in/hr
            // </div>`)
            //     .style("visibility", "visible")
            //     .style("left", `${leftPos}px`)
            //     .style("top", `${centerY}px`)
            //     .style("opacity", 1.0)
            //     .style("position", "fixed");
            this.tooltip
                .html(
                    this.createTooltipFormat(d, `
                        <strong>Duration:</strong> ${d.duration.toFixed(1)} hrs<br/>
                        <strong>2-year:</strong> ${d.year2.toFixed(2)} in/hr<br/>
                        <strong>5-year:</strong> ${d.year5.toFixed(2)} in/hr<br/>
                        <strong>10-year:</strong> ${d.year10.toFixed(2)} in/hr<br/>
                        <strong>25-year:</strong> ${d.year25.toFixed(2)} in/hr<br/>
                        <strong>50-year:</strong> ${d.year50.toFixed(2)} in/hr<br/>
                        <strong>100-year:</strong> ${d.year100.toFixed(2)} in/hr
            `))
            .style("visibility", "visible")
            .style("left", `${leftPos}px`)
            .style("top", `${centerY}px`)
            .style("opacity", 1)
            .style("position", "fixed");
        }
    }

    resize() {
        // Check if the container is visible
        if (!this.isVisible()) return;

        // Get new dimensions
        const container = d3.select(`#${this.containerId}`);
        this.width = parseInt(container.style('width'));
        this.height = parseInt(container.style('height'));
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;

        // Update SVG
        d3.select(`#${this.containerId} svg`)
            .attr("width", this.width)
            .attr("height", this.height);

        // Update scales and axes
        this.createScales();
        this.xAxis.attr("transform", `translate(0,${this.innerHeight})`)
            .call(d3.axisBottom(this.xScale)
                .tickValues(this.durations)
                .tickFormat(d => `${d3.format(".0f")(d)}h`));

        this.yAxis.call(d3.axisLeft(this.yScale)
            .tickValues(this.yScale.ticks(5).filter((d, i) => i % 2 === 0))
            .tickFormat(d => d3.format(".2f")(d)));

        if (this.hasZeroDuration) {
            return;
        }

        // Update lines
        Object.entries(this.lineGenerators).forEach(([period, lineGenerator]) => {
            this.svg.select(`.line.${period}`)
                .attr("d", lineGenerator(this.idfData));
        });

        // Update overlay
        this.svg.select(".overlay")
            .attr("width", this.innerWidth)
            .attr("height", this.innerHeight);

        // Update labels and legend positions
        this.svg.select(".title.idfcurve")
            .attr("x", this.innerWidth/2);

        // Update legend
        const legendWidth = this.legendData.reduce((acc, curr) => acc + curr.length * 6 + 30, 0);
        const legendStartX = (this.innerWidth - legendWidth) / 2;
        const legend = this.svg.select("g[font-family='Arial']")
            .attr("transform", `translate(${legendStartX}, ${-5})`);

        this.legendData.forEach((label, i) => {
            const previousWidth = this.legendData
                .slice(0, i)
                .reduce((acc, curr) => acc + curr.length * 6 + 30, 0);
            legend.select(`g:nth-child(${i + 1})`)
                .attr("transform", `translate(${previousWidth}, ${this.margin.top + this.margin.bottom/2 + this.innerHeight})`);
        });
    }

    debounce(func, wait) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    async updateData(newRawData) {
        this.rawData = newRawData;
        this.idfData = this.calculateIDFCurves(this.rawData);

        // Check if any duration has all zero values
        this.hasZeroDuration = this.idfData.some(data => {
            return ['year2', 'year5', 'year10', 'year25', 'year50', 'year100'].every(year =>
                data[year] === 0 || !data[year]
            );
        });

        // Skip the update if zero values are found
        if (this.hasZeroDuration) {
            // Clear existing lines and points
            Object.keys(this.lineGenerators).forEach(period => {
                this.svg.select(`.line.${period}`).style("display", "none");
            });

            // Remove existing message if any
            this.svg.select(".no-data-message").remove();

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
        } else {
            // Show lines if they were hidden
            Object.keys(this.lineGenerators).forEach(period => {
                this.svg.select(`.line.${period}`).style("display", null);
            });

            // Remove message if it exists
            this.svg.select(".no-data-message").remove();
        }

        // Update scales with new data
        this.createScales();

        // Get current and new y-axis values for transition check
        const currentYValues = this.yAxis.selectAll('.tick')
            .data()
            .filter(d => !isNaN(d));

        const newYValues = this.yScale.ticks(5)
            .filter((d, i) => i % 2 === 0);

        // Calculate the maximum relative change
        const maxRelativeChange = Math.max(
            ...currentYValues.map(curr => {
                const correspondingNew = newYValues.find(n => !isNaN(n));
                if (!curr || !correspondingNew) return 0;
                return Math.abs(curr - correspondingNew) / Math.max(Math.abs(curr), 1e-10);
            })
        );

        // Update axes based on change magnitude
        const xAxis = d3.axisBottom(this.xScale)
            .tickValues(this.durations)
            .tickFormat(d => `${d3.format(".0f")(d)}h`);

        const yAxis = d3.axisLeft(this.yScale)
            .tickValues(this.yScale.ticks(5).filter((d, i) => i % 2 === 0))
            .tickFormat(d => d3.format(".2f")(d));

        if (maxRelativeChange > 1e-10) {
            this.xAxis.transition()
                .duration(750)
                .call(xAxis);

            this.yAxis.transition()
                .duration(750)
                .call(yAxis);
        } else {
            this.xAxis.call(xAxis);
            this.yAxis.call(yAxis);
        }

        // Update all lines
        Object.entries(this.lineGenerators).forEach(([period, lineGenerator]) => {
            // Update line generator with new scales
            lineGenerator.x(d => this.xScale(d.duration))
                .y(d => this.yScale(d[period]));

            const line = this.svg.select(`.line.${period}`);
            const validData = this.idfData.filter(d =>
                !isNaN(d.duration) && !isNaN(d[period]) && d[period] !== null
            );

            // console.log(validData);
            if (maxRelativeChange > 1e-10) {
                line.datum(validData)
                    .transition()
                    .duration(750)
                    .attr("d", lineGenerator);
            } else {
                line.datum(validData)
                    .attr("d", lineGenerator);
            }
        });

        // Update IETDHour text
        this.svg.select(".title.idfcurve")
            .text(this.title);

        // Update overlay size
        this.svg.select(".overlay")
            .attr("width", this.innerWidth)
            .attr("height", this.innerHeight);

        // Update legend positions
        const legendWidth = this.legendData.reduce((acc, curr) => acc + curr.length * 6 + 30, 0);
        const legendStartX = (this.innerWidth - legendWidth) / 2;

        const legend = this.svg.select("g[font-family='Arial']");

        if (maxRelativeChange > 1e-10) {
            legend.transition()
                .duration(750)
                .attr("transform", `translate(${legendStartX}, ${-5})`);

            this.legendData.forEach((label, i) => {
                const previousWidth = this.legendData
                    .slice(0, i)
                    .reduce((acc, curr) => acc + curr.length * 6 + 30, 0);

                this.svg.select(`g[font-family='Arial'] g:nth-child(${i + 1})`)
                    .transition()
                    .duration(750)
                    .attr("transform",
                        `translate(${previousWidth}, ${this.margin.top + this.margin.bottom/2 + this.innerHeight})`
                    );
            });
        } else {
            legend.attr("transform", `translate(${legendStartX}, ${-5})`);

            this.legendData.forEach((label, i) => {
                const previousWidth = this.legendData
                    .slice(0, i)
                    .reduce((acc, curr) => acc + curr.length * 6 + 30, 0);

                this.svg.select(`g[font-family='Arial'] g:nth-child(${i + 1})`)
                    .attr("transform",
                        `translate(${previousWidth}, ${this.margin.top + this.margin.bottom/2 + this.innerHeight})`
                    );
            });
        }
    }


    destroy() {
        try {
            // Remove window event listener with debounced function
            window.removeEventListener('resize', this.debouncedResize);

            // Get container
            const container = d3.select(`#${this.containerId}`);

            // Remove SVG and all its child elements
            container.select("svg").remove();

            // Remove tooltip
            if (this.tooltip) {
                this.tooltip.remove();
                this.tooltip = null;
            }

            // Remove specific elements (in case they weren't removed with svg)
            container.selectAll(".line").remove();
            container.selectAll(".overlay").remove();
            container.selectAll(".focus").remove();
            container.selectAll(".x-axis").remove();
            container.selectAll(".y-axis").remove();
            container.selectAll(".title").remove();
            container.selectAll(".idfcurve").remove();
            container.selectAll(".y.label").remove();
            container.selectAll(".no-data-message").remove();

            // Remove all lines for different return periods
            Object.keys(this.lineColors).forEach(period => {
                container.selectAll(`.line.${period}`).remove();
            });

            // Remove all event listeners
            container.selectAll(".overlay")
                .on("mouseover", null)
                .on("mouseout", null)
                .on("mousemove", null);

            // Clear all data references
            this.rawData = null;
            this.idfData = null;
            this.formattedData = null;
            this.svg = null;
            this.tooltip = null;
            this.focus = null;
            this.xScale = null;
            this.yScale = null;
            this.xAxis = null;
            this.yAxis = null;
            this.lineGenerators = null;
            this.lineColors = null;
            this.legendData = null;
            this.width = null;
            this.height = null;
            this.innerWidth = null;
            this.innerHeight = null;
            this.margin = null;
            this.durations = null;
            this.hasZeroDuration = null;
            this.debouncedResize = null;

            // Call parent's destroy method
            super.destroy();

        } catch (error) {
            console.error('Error in destroy:', error);
        }
    }
}