class VolumetricHydrologyPlot extends ChartCommons{
    constructor(containerId, IETDhour, IETDData) {
        super(containerId);
        this.containerId = containerId;
        this.IETDhour = IETDhour;
        this.IETDData = IETDData;
        this.margin = { top: 20, right: 20, bottom: 50, left: 60 };
        this.title = "Volume-based Hydrology (VBH) Analysis";

        // Data cache for precomputed statistics
        this.statsCache = new Map();

        // Bind methods
        this.resize = this.resize.bind(this);
        this.handleMouseOver = this.handleMouseOver.bind(this);
        this.handleMouseOut = this.handleMouseOut.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);

        // Initialize
        this.processData();
        this.initialize();
    }

    processData() {
        const ranges = [
            {range_from: 0.0, range_to: 0.25, label: "0 ~ 0.25 in"},
            {range_from: 0.25, range_to: 0.5, label: "0.25 ~ 0.5 in"},
            {range_from: 0.5, range_to: 1.0, label: "0.5 ~ 1.0 in"},
            {range_from: 1.0, range_to: 2.0, label: "1.0 ~ 2.0 in"},
            {range_from: 2.0, range_to: 5.0, label: "2.0 ~ 5.0 in"},
            {range_from: 5.0, range_to: 10.0, label: "5.0 ~ 10.0 in"},
            {range_from: 10.0, range_to: 15.0, label: "10.0 ~ 15.0 in"},
            {range_from: 15.0, range_to: 20.0, label: "15.0 ~ 20.0 in"},
            {range_from: 20.0, range_to: Number.MAX_SAFE_INTEGER, label: "20.0 ~ ∞ in"}
        ];

        // Clear previous stats cache when processing new data
        this.statsCache.clear();

        this.formattedData = ranges.map(range => {
            // Filter events for this range
            const sevents = this.IETDData.filter(event => {
                const hpcpsum = event[2];
                return range.range_from < hpcpsum && hpcpsum <= range.range_to;
            }).map(event => ({
                from: event[0],
                to: event[1],
                duration: event[1] - event[0],
                hpcp: event[2],
                period: this.timeFormat(event[0]) + ' ~ ' + this.timeFormat(event[1])
            }));

            // Precompute statistics for this range
            const stats = this.calculateStats(sevents);

            // Store in cache for quick access during mouseover
            this.statsCache.set(range.label, stats);

            return {
                ...range,
                sevents,
                // Store precomputed stats directly in the data object
                stats
            };
        });
    }

    calculateStats(events) {
        if (events.length === 0) return null;

        const stats = {
            hpcp: { avg: 0, max: events[0].hpcp, min: events[0].hpcp },
            duration: { avg: 0, max: events[0].duration, min: events[0].duration }
        };

        events.forEach(event => {
            stats.hpcp.avg += event.hpcp;
            stats.hpcp.max = Math.max(stats.hpcp.max, event.hpcp);
            stats.hpcp.min = Math.min(stats.hpcp.min, event.hpcp);

            stats.duration.avg += event.duration;
            stats.duration.max = Math.max(stats.duration.max, event.duration);
            stats.duration.min = Math.min(stats.duration.min, event.duration);
        });

        stats.hpcp.avg /= events.length;
        stats.duration.avg /= events.length;

        return stats;
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
        this.xScale = d3.scaleBand()
            .range([0, this.innerWidth])
            .domain(this.formattedData.map(d => d.label))
            .padding(0.1);

        this.yScale = d3.scaleSymlog()
            .domain([0, d3.max(this.formattedData, d => d.sevents.length)])
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
            .attr("dy", ".75em");

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
            .attr("data-indicator", d => d.label)
            .attr("x", d => this.margin.left + this.xScale(d.label))
            .attr("y", d => this.margin.top + this.yScale(d.sevents.length))
            .attr("width", this.xScale.bandwidth())
            .attr("height", d => this.innerHeight - this.yScale(d.sevents.length))
            .attr("fill", "steelblue")
            .on("mouseover", this.handleMouseOver)
            .on("mouseout", this.handleMouseOut)
            .on("dblclick", this.handleDoubleClick);

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
            .text(d => d.sevents.length || '')
            .attr("x", d => this.margin.left + this.xScale(d.label) + this.xScale.bandwidth()/2)
            .attr("y", d => this.margin.top * 1.5 + this.yScale(d.sevents.length))
            .attr("font-family", "Arial")
            .attr("font-size", "9px")
            .attr("text-anchor", "middle")
            .attr("fill", "#ffffff");
    }

    createTitles() {
        this.chartTitle = this.svg.append("text")
            .attr("class", "title volumetrichydrology")
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
            .text('# of Precipitation Events')
            .attr("font-family", "Arial");
    }

    formatTooltip(label, stats) {
        if (!stats) return '';

        const hoursFormat = ms => (ms / 1000 / 60 / 60).toFixed(0);

        return `
                <span style="color:blue">${label}</span><br/>
                HPCP Avg: ${stats.hpcp.avg.toFixed(2)} | Max: ${stats.hpcp.max.toFixed(2)} | Min: ${stats.hpcp.min.toFixed(2)}<br/>
                Duration Avg: ${hoursFormat(stats.duration.avg)} hours | Max: ${hoursFormat(stats.duration.max)} hours | Min: ${hoursFormat(stats.duration.min)} hours
            `;
    }


    handleMouseOver(event, d) {
        if (d.sevents.length < 100) {
            d.sevents.forEach(event => {
                if (typeof addHighlights_in_Highcharts === 'function') {
                    addHighlights_in_Highcharts(event.from, event.to);
                }
            });

            if (typeof addHighlightD3Glyphs === 'function') {
                addHighlightD3Glyphs(d.label, "brown");
                d.sevents.forEach(event => {
                    addHighlightD3Glyphs(event.period, "brown", d.sevents.length);
                });
            }
        }

        this.tooltip
            .html(
                this.createTooltipFormat(d, this.formatTooltip(d.label, d.stats)))
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
        if (d.sevents.length < 100) {
            if (typeof removeHighlights_in_allHighcharts === 'function') {
                removeHighlights_in_allHighcharts();
            }

            if (typeof removeHighlightD3Glyphs === 'function') {
                removeHighlightD3Glyphs(d.label);
                d.sevents.forEach(event => {
                    removeHighlightD3Glyphs(event.period);
                });
            }
        }

        this.tooltip.style("visibility", "hidden");
    }

    handleDoubleClick(event, d) {
        // Double-click handling logic here if needed
    }

    resize() {
        // Check if the container is visible
        if (!this.isVisible()) return;

        // Update dimensions
        const container = d3.select(`#${this.containerId}`);
        this.width = parseInt(container.style('width'));
        this.innerWidth = this.width - this.margin.left - this.margin.right;

        this.svg.attr("width", this.width);
        this.xScale.range([0, this.innerWidth]);

        this.svg.select(".x.axis")
            .call(d3.axisBottom(this.xScale))
            .selectAll(".tick text")
            .style("text-anchor", "middle")
            .attr("dy", ".75em");

        this.dedupeLabels(this.svg.select(".x.axis").selectAll(".tick text"));

        this.labelBar
            .attr("x", d => this.margin.left + this.xScale(d.label) + this.xScale.bandwidth()/2);

        this.chartTitle
            .attr("x", this.margin.left + this.innerWidth/2);

        this.bars.transition()
            .duration(1000)
            .attr("x", d => this.margin.left + this.xScale(d.label))
            .attr("width", this.xScale.bandwidth());
    }

    async updateData(newIETDData, newIETDHour) {
        this.IETDData = newIETDData;
        this.IETDhour = newIETDHour;

        this.processData();
        this.createScales();

        // Remove existing message if any
        this.svg.select(".no-data-message").remove();

        if (this.IETDData.length < 50) {

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

        // Update visualization with transitions
        this.updateVisualization();
    }

    updateVisualization() {
        // Update bars
        const bars = this.svg.selectAll(".bar")
            .data(this.formattedData);

        bars.exit().remove();

        bars.transition()
            .duration(750)
            .attr("x", d => this.margin.left + this.xScale(d.label))
            .attr("y", d => this.margin.top + this.yScale(d.sevents.length))
            .attr("width", this.xScale.bandwidth())
            .attr("height", d => this.innerHeight - this.yScale(d.sevents.length));

        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("data-indicator", d => d.label)
            .attr("fill", "steelblue")
            .attr("x", d => this.margin.left + this.xScale(d.label))
            .attr("y", d => this.margin.top + this.yScale(d.sevents.length))
            .attr("width", this.xScale.bandwidth())
            .attr("height", d => this.innerHeight - this.yScale(d.sevents.length))
            .on("mouseover", this.handleMouseOver)
            .on("mouseout", this.handleMouseOut)
            .on("dblclick", this.handleDoubleClick);

        // Update labels
        this.updateLabels();

        // Update axes
        this.updateAxes();
    }

    updateLabels() {
        const labels = this.svg.selectAll(".bar-label")
            .data(this.formattedData);

        labels.exit().remove();

        labels.transition()
            .duration(750)
            .attr("x", d => this.margin.left + this.xScale(d.label) + this.xScale.bandwidth()/2)
            .attr("y", d => this.margin.top * 1.5 + this.yScale(d.sevents.length))
            .text(d => d.sevents.length || '');

        labels.enter()
            .append("text")
            .attr("class", "bar-label")
            .attr("font-family", "Arial")
            .attr("font-size", "9px")
            .attr("text-anchor", "middle")
            .attr("fill", "#ffffff")
            .attr("x", d => this.margin.left + this.xScale(d.label) + this.xScale.bandwidth()/2)
            .attr("y", d => this.margin.top * 1.5 + this.yScale(d.sevents.length))
            .text(d => d.sevents.length || '');
    }

    updateAxes() {
        this.svg.select(".x.axis")
            .transition()
            .duration(750)
            .call(d3.axisBottom(this.xScale));

        this.dedupeLabels(this.svg.select(".x.axis").selectAll(".tick text"));

        this.svg.select(".y.axis")
            .transition()
            .duration(750)
            .call(d3.axisLeft(this.yScale).ticks(3)
                .tickFormat(d => d3.format("")(d)));
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
            container.selectAll(".volumetrichydrology").remove();
            container.selectAll(".no-data-message").remove();

            // Remove all event listeners
            container.selectAll(".bar")
                .on("mouseover", null)
                .on("mouseout", null)
                .on("dblclick", null);

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
            this.width = null;
            this.height = null;
            this.innerWidth = null;
            this.innerHeight = null;
            this.margin = null;

            // Clear handler methods
            this.handleMouseOver = null;
            this.handleMouseOut = null;
            this.handleDoubleClick = null;

            // Clear utility methods
            this.calculateStats = null;
            this.formatTooltip = null;
            this.timeFormat = null;
            this.dedupeLabels = null;

            // Clear update methods
            this.updateVisualization = null;
            this.updateLabels = null;
            this.updateAxes = null;

            // Clear data cache
            this.statsCache.clear();
            this.statsCache = null;

            // Call parent's destroy method
            super.destroy();

        } catch (error) {
            console.error('Error in destroy:', error);
        }
    }
}