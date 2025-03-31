class PeakOverThresholdPlot extends ChartCommons{
    constructor(containerId, IETDhour, IETDData, threshold = 1.0) {
        super(containerId);
        this.containerId = containerId;
        this.IETDhour = IETDhour;
        this.IETDData = IETDData;
        this.threshold = threshold;
        this.margin = { top: 20, right: 20, bottom: 50, left: 60 };
        this.title = "Peak-Over-Threshold Analysis";

        // Configuration
        this.exceedanceColor = "#ff7f7f"; // Color for points exceeding threshold
        this.nonExceedanceColor = "#7f7fff"; // Color for points below threshold
        this.thresholdLineColor = "#666666"; // Gray for threshold line

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

    processData() {
        if (!Array.isArray(this.IETDData) || this.IETDData.length === 0) {
            console.error('Invalid or empty IETDData');
            return;
        }

        try {
            // Format the basic data
            this.formattedData = this.IETDData.map(data => {
                const [datefrom, dateto, volume] = data;
                return {
                    date: new Date(datefrom),
                    volume: volume,
                    from: datefrom,
                    to: dateto,
                    period: `${this.timeFormat(datefrom)} ~ ${this.timeFormat(dateto)}`,
                    exceedance: volume > this.threshold,
                    exceedanceValue: Math.max(0, volume - this.threshold)
                };
            }).sort((a, b) => a.date - b.date);

            // Filter for exceedances
            this.exceedances = this.formattedData.filter(d => d.exceedance);

            // Calculate percentage of exceedances
            this.exceedancePercentage = (this.exceedances.length / this.formattedData.length * 100).toFixed(1);

        } catch (error) {
            console.error('Error processing POT data:', error);
            return null;
        }
    }

    initialize() {
        const container = d3.select(`#${this.containerId}`);
        this.width = parseInt(container.style('width'));
        this.height = parseInt(container.style('height'));
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;

        this.createSvg();
        this.createScales();
        this.createAxes();
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
        this.xScale = d3.scaleTime()
            .domain(d3.extent(this.formattedData, d => d.date))
            .range([0, this.innerWidth]);

        // Change to symlog scale
        const maxVolume = d3.max(this.formattedData, d => d.volume);
        const minVolume = 0;  // Can start from 0 with symlog
        this.yScale = d3.scaleSymlog()
            .domain([minVolume, maxVolume])
            .range([this.innerHeight, 0])
            .constant(0.1)  // Adjusts the behavior near zero
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

        // Custom tick format for symlog scale
        const symlogTickFormat = (d) => {
            if (d >= 1) return d3.format(".0f")(d);
            if (d >= 0.1) return d3.format(".1f")(d);
            if (d === 0) return "0";
            return d3.format(".2f")(d);
        };

        // Generate custom tick values for symlog scale
        const symlogTicks = () => {
            const domain = this.yScale.domain();
            const maxPow = Math.ceil(Math.log10(domain[1]));
            const ticks = [0];  // Always include 0

            // Add positive ticks
            for (let pow = 0; pow <= maxPow; pow++) {
                const mainTick = Math.pow(10, pow);
                ticks.push(mainTick);

                // Add intermediate ticks for better readability
                if (pow < maxPow) {
                    [2, 4, 6, 8].forEach(n => {
                        const intermediateTick = n * Math.pow(10, pow);
                        if (intermediateTick <= domain[1]) {
                            ticks.push(intermediateTick);
                        }
                    });
                }
            }

            return ticks;
        };

        this.yAxis = this.svg.append("g")
            .attr("class", "y axis")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
            .call(d3.axisLeft(this.yScale)
                .tickValues(symlogTicks())
                .tickFormat(symlogTickFormat));
    }

    createVisualization() {
        // Add threshold line
        this.svg.append("line")
            .attr("class", "threshold-line")
            .attr("x1", this.margin.left)
            .attr("x2", this.margin.left + this.innerWidth)
            .attr("y1", this.margin.top + this.yScale(this.threshold))
            .attr("y2", this.margin.top + this.yScale(this.threshold))
            .attr("stroke", this.thresholdLineColor)
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4,4");

        // Add points
        this.points = this.svg.selectAll(".pot-point")
            .data(this.formattedData)
            .enter()
            .append("circle")
            .attr("class", "pot-point")
            .attr("data-indicator", d => d.period)
            .attr("cx", d => this.margin.left + this.xScale(d.date))
            .attr("cy", d => this.margin.top + this.yScale(d.volume))
            .attr("r", 5)
            .attr("fill", d => d.exceedance ? this.exceedanceColor : this.nonExceedanceColor)
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .on("mouseover", (event, d) => this.handleMouseOver(event, d))
            .on("mouseout", (event, d) => this.handleMouseOut(event, d));

        // Add connecting lines
        const lineGenerator = d3.line()
            .x(d => this.margin.left + this.xScale(d.date))
            .y(d => this.margin.top + this.yScale(d.volume))
            .curve(d3.curveMonotoneX);

        this.svg.append("path")
            .datum(this.formattedData)
            .attr("class", "pot-line")
            .attr("fill", "none")
            .attr("stroke", "#999999")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4,4")
            .attr("d", lineGenerator);

        this.createTitles();
    }

    createTitles() {
        const IETDHour_text = 'IETD=' + this.IETDhour + ' ' +
            ((this.IETDhour > 1) ? 'hours' : 'hour');

        this.chartTitle = this.svg.append("text")
            .attr("class", "title pot")
            .attr("x", this.innerWidth/2)
            .attr("y", 15)
            .attr('text-anchor', 'middle')
            .attr("font-family", "Arial")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .text(`${this.title} (${IETDHour_text}, Threshold = ${this.threshold} inches)`);

        // Add exceedance percentage
        this.svg.append("text")
            .attr("class", "exceedance-percentage")
            .attr("x", this.innerWidth/2)
            .attr("y", 35)
            .attr('text-anchor', 'middle')
            .attr("font-family", "Arial")
            .attr("font-size", "10px")
            .text(`${this.exceedancePercentage}% of events exceed threshold (${this.exceedances.length} of ${this.formattedData.length})`);

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
        if (typeof addHighlights_in_Highcharts === 'function') {
            addHighlights_in_Highcharts(d.from, d.to);
        }

        if (typeof addHighlightD3Glyphs === 'function') {
            addHighlightD3Glyphs(d.period, "brown");
        }

        // this.tooltip.html(`
        //     <div style="padding: 3px; border-radius: 8px; box-shadow:0 10px 16px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19) !important;">
        //         <span style="color:blue">${d.period}</span><br/>
        //         Value: ${d.volume.toFixed(2)} inches<br/>
        //         Threshold: ${this.threshold} inches<br/>
        //         Exceedance: ${d.exceedanceValue.toFixed(2)} inches
        //     </div>`)
        //     .style("visibility", "visible")
        //     .style("top", (event.pageY - 10) + "px")
        //     .style("left", (event.pageX + 10) + "px");

        this.tooltip
            .html(
                this.createTooltipFormat(d, `
                   <span style="color:blue">${d.period}</span><br/>
                    Value: ${d.volume.toFixed(2)} inches<br/>
                    Threshold: ${this.threshold} inches<br/>
                    Exceedance: ${d.exceedanceValue.toFixed(2)} inches
            `))
            .style("visibility", "visible")
            .style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 10) + "px");

        // Highlight point
        d3.select(event.target)
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

        // Reset highlighted point
        d3.select(event.target)
            .attr("r", 5)
            .attr("stroke-width", 1)
            .attr("fill", d => d.exceedance ? this.exceedanceColor : this.nonExceedanceColor);
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

        // Update threshold line
        this.svg.select(".threshold-line")
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
            .y(d => this.margin.top + this.yScale(d.volume))
            .curve(d3.curveMonotoneX);

        this.svg.select(".pot-line")
            .transition()
            .duration(500)
            .attr("d", lineGenerator);

        // Update title positions
        this.chartTitle
            .attr("x", this.margin.left + this.innerWidth/2);

        this.svg.select(".exceedance-percentage")
            .attr("x", this.innerWidth/2);
    }

    async updateData(newIETDData, newIETDHour, newThreshold = null) {
        this.IETDData = newIETDData;
        this.IETDhour = newIETDHour;
        if (newThreshold !== null) {
            this.threshold = newThreshold;
        }

        this.processData();
        this.createScales();

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

        // In updateData method, replace the y-axis update section with:
        const symlogTickFormat = (d) => {
            if (d >= 1) return d3.format(".0f")(d);
            if (d >= 0.1) return d3.format(".1f")(d);
            if (d === 0) return "0";
            return d3.format(".2f")(d);
        };

        const symlogTicks = () => {
            const domain = this.yScale.domain();
            const maxPow = Math.ceil(Math.log10(domain[1]));
            const ticks = [0];

            for (let pow = 0; pow <= maxPow; pow++) {
                const mainTick = Math.pow(10, pow);
                ticks.push(mainTick);

                if (pow < maxPow) {
                    [2, 4, 6, 8].forEach(n => {
                        const intermediateTick = n * Math.pow(10, pow);
                        if (intermediateTick <= domain[1]) {
                            ticks.push(intermediateTick);
                        }
                    });
                }
            }

            return ticks;
        };

        // Update the y-axis
        this.svg.select(".y.axis")
            .transition()
            .duration(750)
            .call(d3.axisLeft(this.yScale)
                .tickValues(symlogTicks())
                .tickFormat(symlogTickFormat));

        // Update threshold line
        this.svg.select(".threshold-line")
            .transition()
            .duration(750)
            .attr("y1", this.margin.top + this.yScale(this.threshold))
            .attr("y2", this.margin.top + this.yScale(this.threshold));

        // Update points
        const points = this.svg.selectAll(".pot-point")
            .data(this.formattedData);

        points.exit().remove();

        points.transition()
            .duration(750)
            .attr("cx", d => this.margin.left + this.xScale(d.date))
            .attr("cy", d => this.margin.top + this.yScale(d.volume))
            .attr("fill", d => d.exceedance ? this.exceedanceColor : this.nonExceedanceColor);

        points.enter()
            .append("circle")
            .attr("class", "pot-point")
            .attr("r", 5)
            .attr("fill", d => d.exceedance ? this.exceedanceColor : this.nonExceedanceColor)
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .attr("cx", d => this.margin.left + this.xScale(d.date))
            .attr("cy", d => this.margin.top + this.yScale(d.volume))
            .on("mouseover", (event, d) => this.handleMouseOver(event, d))
            .on("mouseout", (event, d) => this.handleMouseOut(event, d));

        // Update connecting lines
        const lineGenerator = d3.line()
            .x(d => this.margin.left + this.xScale(d.date))
            .y(d => this.margin.top + this.yScale(d.volume))
            .curve(d3.curveMonotoneX);

        this.svg.select(".pot-line")
            .datum(this.formattedData)
            .transition()
            .duration(750)
            .attr("d", lineGenerator);

        // Update titles
        const IETDHour_text = 'IETD=' + this.IETDhour + ' ' +
            ((this.IETDhour > 1) ? 'hours' : 'hour');
        this.chartTitle.text(`${this.title} (${IETDHour_text}, Threshold = ${this.threshold} inches)`);

        this.svg.select(".exceedance-percentage")
            .text(`${this.exceedancePercentage}% of events exceed threshold (${this.exceedances.length} of ${this.formattedData.length})`);
    }

    addHighlights(indicator) {
        const selectedPoints = this.svg.selectAll("circle.pot-point")
            .filter(function() {
                return (d3.select(this).attr("data-indicator") === indicator);
            });

        selectedPoints
            .attr("r", 7)
            .attr("stroke-width", 2)
            .attr("fill", "brown");
    }

    removeHighlights(indicator) {
        const exceedanceColor = this.exceedanceColor;
        const nonExceedanceColor = this.nonExceedanceColor;

        const selectedPoints = this.svg.selectAll("circle.pot-point")
            .filter(function() {
                return (d3.select(this).attr("data-indicator") === indicator);
            });

        selectedPoints
            .attr("r", 5)
            .attr("stroke-width", 1)
            .attr("fill", d => d.exceedance ? exceedanceColor : nonExceedanceColor);
    }

    destroy() {
        try {
            // Remove window event listener
            window.removeEventListener('resize', this.resize);

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
            container.selectAll(".pot-point").remove();
            container.selectAll(".pot-line").remove();
            container.selectAll(".threshold-line").remove();
            container.selectAll(".x.axis").remove();
            container.selectAll(".y.axis").remove();
            container.selectAll(".title").remove();
            container.selectAll(".pot").remove();
            container.selectAll(".exceedance-percentage").remove();

            // Remove all event listeners from points
            container.selectAll(".pot-point")
                .on("mouseover", null)
                .on("mouseout", null);

            // Clear all data references
            this.IETDData = null;
            this.formattedData = null;
            this.exceedances = null;
            this.svg = null;
            this.tooltip = null;
            this.points = null;
            this.xScale = null;
            this.yScale = null;
            this.xAxis = null;
            this.yAxis = null;
            this.chartTitle = null;
            this.width = null;
            this.height = null;
            this.innerWidth = null;
            this.innerHeight = null;
            this.margin = null;
            this.threshold = null;
            this.IETDhour = null;
            this.exceedancePercentage = null;

            // Clear color references
            this.exceedanceColor = null;
            this.nonExceedanceColor = null;
            this.thresholdLineColor = null;

            // Call parent's destroy method
            super.destroy();

        } catch (error) {
            console.error('Error in destroy:', error);
        }
    }
}