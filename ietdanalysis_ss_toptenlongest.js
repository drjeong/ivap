class TopTenLongestPrecipitationPlot extends ChartCommons{
    constructor(containerId, IETDhour, IETDData) {
        super(containerId);
        this.containerId = containerId;
        this.IETDhour = IETDhour;
        this.IETDData = IETDData;
        this.margin = { top: 20, right: 20, bottom: 50, left: 60 };
        this.title = "Ten Longest (Duration) Precipitation";
        this.innerPadding = 0.1;
        this.outerPadding = 0.05;

        // Bind methods
        this.resize = this.resize.bind(this);
        this.processData = this.processData.bind(this);
        this.handleMouseOver = this.handleMouseOver.bind(this);
        this.handleMouseOut = this.handleMouseOut.bind(this);
        this.handleClick = this.handleClick.bind(this);

        // Initialize
        this.processData();
        this.initialize();
    }

    // Helper methods for layout calculations
    calculateAlpha(values, innerWidth) {
        const n = values.length;
        const total = 1;
        return (innerWidth - (n - 1) * this.innerPadding * innerWidth / n -
            2 * this.outerPadding * innerWidth / n) / total;
    }

    calculateWi(values, alpha) {
        return (i) => values[i].duration_ratio * alpha;
    }

    calculateMidi(values, alpha, innerWidth) {
        const w = this.calculateWi(values, alpha);
        const n = values.length;

        return (_, i) => {
            const op = this.outerPadding * innerWidth / n;
            const p = this.innerPadding * innerWidth / n;
            const sum = d3.sum(values.slice(0, i), d => d.duration_ratio);
            return op + sum * alpha + i * p + w(i) / 2;
        };
    }

    // Data processing methods
    processData() {
        // Sort and get top 10 events by duration
        const sortedData = Array.from(this.IETDData)
            .sort((e1, e2) => (e2[1] - e2[0]) - (e1[1] - e1[0]))
            .slice(0, 10);

        this.formattedData = this.formatData(sortedData);
    }

    formatData(topTenEvents) {
        let totalDuration = 0;

        // Calculate total duration
        topTenEvents.forEach(event => {
            const duration = event[1] - event[0];
            totalDuration += duration;
        });

        // Format the data
        return topTenEvents.map(event => {
            const duration = event[1] - event[0];
            return {
                label: this.timePeriod(event[0], event[1]),
                period: `${this.timeFormat(event[0])} ~ ${this.timeFormat(event[1])}`,
                from: event[0],
                to: event[1],
                duration: duration,
                duration_ratio: duration / totalDuration,
                volume: event[2]
            };
        });
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

    timePeriod(startDate, endDate) {
        if (!startDate || !endDate) return '';
        try {
            const start = new Date(startDate);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
            return `${start.getFullYear()} ${months[start.getMonth()]} ${start.getDate().toString().padStart(2, '0')} ${start.getHours().toString().padStart(2, '0')}h`;
        } catch (e) {
            return '';
        }
    }

    initialize() {
        // Get container dimensions
        const container = d3.select(`#${this.containerId}`);
        this.width = parseInt(container.style('width'));
        this.height = parseInt(container.style('height'));
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;

        // Calculate layout parameters
        this.alpha = this.calculateAlpha(this.formattedData, this.innerWidth);
        this.mid = this.calculateMidi(this.formattedData, this.alpha, this.innerWidth);

        // Create visualization
        this.createSvg();
        this.createScales();
        this.createAxes();
        this.createVisualization();

        // Add resize listener
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
        this.xScale = d3.scaleOrdinal()
            .range(this.formattedData.map(this.mid))
            .domain(this.formattedData.map(d => d.label));

        this.yScale = d3.scaleSymlog()
            .domain([0, d3.max(this.formattedData, d => d.volume)])
            .range([this.innerHeight, 0]);
    }

    createAxes() {
        this.xAxis = this.svg.append("g")
            .attr("class", "x axis")
            .attr("color", "black")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top + this.innerHeight})`)
            .call(d3.axisBottom(this.xScale))
            .selectAll("text")
            .style("text-anchor", "middle")
            .attr("dy", ".75em")
            .attr("transform", "translate(0,0)");

        // Add deduping after creating x-axis
        this.dedupeLabels(this.svg.select(".x.axis").selectAll(".tick text"));

        this.yAxis = this.svg.append("g")
            .attr("class", "y axis")
            .attr("color", "black")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
            .call(d3.axisLeft(this.yScale).ticks(3)
                .tickFormat(d => d3.format("")(d)));
    }

    createVisualization() {
        // Create bars
        this.bars = this.svg.selectAll(".bar")
            .data(this.formattedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("data-indicator", d => d.period)
            .attr("x", d => this.margin.left + this.xScale(d.label) - this.alpha * d.duration_ratio / 2)
            .attr("y", d => this.margin.top + this.yScale(d.volume))
            .attr("width", d => this.alpha * d.duration_ratio)
            .attr("height", d => this.innerHeight - this.yScale(d.volume))
            .attr("fill", "steelblue")
            .on("mouseover", this.handleMouseOver)
            .on("mouseout", this.handleMouseOut)
            .on("click", this.handleClick);

        // Add labels
        this.createLabels();

        // Add title and axes labels
        this.createTitles();
    }

    createLabels() {
        this.labelBar = this.svg.selectAll(".bar-label")
            .data(this.formattedData)
            .enter()
            .append("text")
            .attr("class", "bar-label")
            .text(d => d.volume.toFixed(2))
            .attr("x", d => this.margin.left + this.xScale(d.label))
            .attr("y", d => this.margin.top * 1.5 + this.yScale(d.volume))
            .attr("font-family", "Arial")
            .attr("font-size", "9px")
            .attr("text-anchor", "middle")
            .attr("fill", "#ffffff");
    }

    createTitles() {
        this.chartTitle = this.svg.append("text")
            .attr("class", "title toptenlongest")
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
            .text('HPD (inch)')
            .attr("font-family", "Arial");
    }

    // check label overlap and skip drawing
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

        // Sort by x position
        rects.sort((a, b) => a.x - b.x);

        // Always make first label visible
        if (rects.length > 0) {
            d3.select(rects[0].element).style("opacity", 1);
            rects[0].visible = true;
        }

        // Process overlaps starting from second label
        let lastVisibleIndex = 0;

        for (let i = 1; i < rects.length; i++) {
            const curr = rects[i];
            const lastVisible = rects[lastVisibleIndex];

            // Check if current label overlaps with last visible label
            if (lastVisible.x + lastVisible.width + 5 > curr.x) {
                // Hide the current label
                d3.select(curr.element).style("opacity", 0);
                curr.visible = false;
            } else {
                // Show the current label and update lastVisibleIndex
                d3.select(curr.element).style("opacity", 1);
                curr.visible = true;
                lastVisibleIndex = i;
            }

            // If current label was hidden, check if it can be shown
            if (!curr.visible && i > 1) { // Only check for labels after the second one
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

    handleMouseOver(event, d) {
        if (typeof addHighlights_in_Highcharts === 'function') {
            // Fire and forget - don't wait for completion
            addHighlights_in_Highcharts(d.from, d.to)
                .catch(error => console.error('Error in highlight process:', error));
        }

        if (typeof addHighlightD3Glyphs === 'function') {
            addHighlightD3Glyphs(d.period, "brown");
        }

        this.tooltip
            .html(
                this.createTooltipFormat(d,
                    `<span style="color:blue">${d.period}</span><br/>
                HPD: ${d.volume.toFixed(2)}<br/>
                Duration: ${(d.duration / 1000 / 60 / 60).toFixed(0)} hours
            `))
            .style("visibility", "visible")
            .style("top", (event.pageY - this.tooltip.node().offsetHeight - 20) + "px")
            .style("left", (() => {
                let leftpos = event.pageX;
                if (leftpos > this.innerWidth) {
                    leftpos = leftpos - this.tooltip.node().offsetWidth;
                }
                return leftpos + "px";
            })());
    }

    handleMouseOut(event, d) {
        if (typeof removeHighlights_in_allHighcharts === 'function') {
            // Fire and forget - don't wait for completion
            removeHighlights_in_allHighcharts()
                .catch(error => console.error('Error in highlight process:', error));
        }

        if (typeof removeHighlightD3Glyphs === 'function') {
            removeHighlightD3Glyphs(d.period);
        }

        this.tooltip.style("visibility", "hidden");
    }

    handleClick(event, d) {
        if (typeof g_ZoomingEnabled !== 'undefined' && g_ZoomingEnabled === true) {
            if (typeof g_PreviousTimeRangeWhenZoomingActivated !== 'undefined' &&
                Array.isArray(g_PreviousTimeRangeWhenZoomingActivated) &&
                g_PreviousTimeRangeWhenZoomingActivated.length === 0) {

                const chart = Highcharts.charts.find(chart => chart.renderTo.id == 'chart_hpcp_hourlydata');
                if (chart) {
                    const range = chart.xAxis[0].getExtremes();
                    g_PreviousTimeRangeWhenZoomingActivated = [range.min, range.max];
                }
            }

            if (typeof HichartZooming === 'function') {
                HichartZooming(d.from, d.to);
            }

            if (typeof redrawHighlights_in_allHighcharts === 'function') {
                redrawHighlights_in_allHighcharts();
            }
        }
    }

    resize() {
        // Check if the container is visible
        if (!this.isVisible()) return;

        // Update dimensions
        const container = d3.select(`#${this.containerId}`);
        this.width = parseInt(container.style('width'));
        this.innerWidth = this.width - this.margin.left - this.margin.right;

        this.alpha = this.calculateAlpha(this.formattedData, this.innerWidth);
        this.mid = this.calculateMidi(this.formattedData, this.alpha, this.innerWidth);

        this.svg.attr("width", this.width);
        this.xScale.range(this.formattedData.map(this.mid));

        // Update x-axis and handle overlapping labels
        this.svg.select(".x.axis")
            .call(d3.axisBottom(this.xScale))
            .selectAll(".tick text")
            .style("text-anchor", "middle")
            .attr("dy", ".75em");

        // Add deduping after updating x-axis
        this.dedupeLabels(this.svg.select(".x.axis").selectAll(".tick text"));

        this.labelBar
            .attr("x", d => this.margin.left + this.xScale(d.label));

        this.chartTitle
            .attr("x", this.margin.left + this.innerWidth/2);

        this.bars.transition()
            .duration(1000)
            .attr("x", d => this.margin.left + this.xScale(d.label) - this.alpha * d.duration_ratio / 2)
            .attr("width", d => this.alpha * d.duration_ratio);
    }

    async updateData(newIETDData, newIETDHour) {
        this.IETDData = newIETDData;
        this.IETDhour = newIETDHour;

        this.processData();

        // Check for zero values
        const hasZeroElement = this.formattedData.some(data =>
            !data ||
            data.volume === 0 ||
            data.duration_ratio === 0 ||
            isNaN(data.volume) ||
            isNaN(data.duration_ratio)
        );

        // Remove existing message if any
        this.svg.select(".no-data-message").remove();

        if (hasZeroElement || this.IETDData.length < 50) {
            this.svg.selectAll(".bar").remove();
            this.svg.selectAll(".bar-label").remove();

            // Add message in the middle of the chart
            this.svg.append("text")
                .attr("class", "no-data-message")
                .attr("x", this.margin.left + this.innerWidth / 2)
                .attr("y", this.innerHeight / 2)
                .attr("text-anchor", "middle")
                .attr("alignment-baseline", "middle")
                .style("font-size", "14px")
                .style("fill", "#666")
                .text("Not enough data!");

            return;
        }

        this.alpha = this.calculateAlpha(this.formattedData, this.innerWidth);
        this.mid = this.calculateMidi(this.formattedData, this.alpha, this.innerWidth);

        this.createScales();

        // Update visualization with transitions
        this.updateVisualization();
    }

    updateVisualization() {
        // Update bars
        const bars = this.svg.selectAll(".bar")
            .data(this.formattedData);

        // Remove old bars
        bars.exit().remove();

        // Update existing bars
        bars
            .attr("data-indicator", d => d.period)
            .transition()
            .duration(750)
            .attr("x", d => this.margin.left + this.xScale(d.label) - this.alpha * d.duration_ratio / 2)
            .attr("y", d => this.margin.top + this.yScale(d.volume))
            .attr("width", d => this.alpha * d.duration_ratio)
            .attr("height", d => this.innerHeight - this.yScale(d.volume));

        // Add new bars
        const newBars = bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("data-indicator", d => d.period)
            .attr("fill", "steelblue")
            .attr("x", d => this.margin.left + this.xScale(d.label) - this.alpha * d.duration_ratio / 2)
            .attr("y", d => this.margin.top + this.yScale(d.volume))
            .attr("width", d => this.alpha * d.duration_ratio)
            .attr("height", d => this.innerHeight - this.yScale(d.volume));

        // Merge new and existing bars and bind events
        bars.merge(newBars)
            .on("mouseover", (event, d) => this.handleMouseOver(event, d))
            .on("mouseout", (event, d) => this.handleMouseOut(event, d))
            .on("click", (event, d) => this.handleClick(event, d));

        // Update labels
        const labels = this.svg.selectAll(".bar-label")
            .data(this.formattedData);

        labels.exit().remove();

        labels
            .transition()
            .duration(750)
            .attr("x", d => this.margin.left + this.xScale(d.label))
            .attr("y", d => this.margin.top * 1.5 + this.yScale(d.volume))
            .text(d => d.volume.toFixed(2));

        labels.enter()
            .append("text")
            .attr("class", "bar-label")
            .attr("font-family", "Arial")
            .attr("font-size", "9px")
            .attr("text-anchor", "middle")
            .attr("fill", "#ffffff")
            .attr("x", d => this.margin.left + this.xScale(d.label))
            .attr("y", d => this.margin.top * 1.5 + this.yScale(d.volume))
            .text(d => d.volume.toFixed(2));

        // Rest of the code remains the same...
        this.svg.select(".x.axis")
            .transition()
            .duration(750)
            .call(d3.axisBottom(this.xScale))
            .on("end", () => {
                this.dedupeLabels(this.svg.select(".x.axis").selectAll(".tick text"));
            });

        this.svg.select(".y.axis")
            .transition()
            .duration(750)
            .call(d3.axisLeft(this.yScale).ticks(3)
                .tickFormat(d => d3.format("")(d)));

        this.chartTitle.text(this.title);
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
            container.selectAll(".bar").remove();
            container.selectAll(".bar-label").remove();
            container.selectAll(".x.axis").remove();
            container.selectAll(".y.axis").remove();
            container.selectAll(".title").remove();
            container.selectAll(".toptenlongest").remove();
            container.selectAll(".no-data-message").remove();

            // Remove all event listeners from bars
            container.selectAll(".bar")
                .on("mouseover", null)
                .on("mouseout", null)
                .on("click", null);

            // Clear all data references
            this.IETDData = null;
            this.formattedData = null;
            this.svg = null;
            this.tooltip = null;
            this.xScale = null;
            this.yScale = null;
            this.xAxis = null;
            this.yAxis = null;
            this.bars = null;
            this.labelBar = null;
            this.chartTitle = null;
            this.alpha = null;
            this.mid = null;
            this.width = null;
            this.height = null;
            this.innerWidth = null;
            this.innerHeight = null;
            this.margin = null;
            this.innerPadding = null;
            this.outerPadding = null;

            // Clear layout calculation functions
            this.calculateAlpha = null;
            this.calculateWi = null;
            this.calculateMidi = null;

            // Clear event handlers
            this.handleMouseOver = null;
            this.handleMouseOut = null;
            this.handleClick = null;

            // Clear formatting functions
            this.timeFormat = null;
            this.timePeriod = null;

            // Call parent's destroy method
            super.destroy();

        } catch (error) {
            console.error('Error in destroy:', error);
        }
    }
}
