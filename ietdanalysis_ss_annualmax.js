class AnnualMaximumPrecipitationPlot extends ChartCommons{
    constructor(containerId, IETDhour, IETDData) {
        super(containerId);
        this.containerId = containerId;
        this.IETDhour = IETDhour;
        this.IETDData = IETDData;
        this.margin = { top: 20, right: 20, bottom: 50, left: 60 };
        this.title = "Annual Maximum Precipitation Events Analysis";
        this.innerPadding = 0.1;
        this.outerPadding = 0.05;

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

            // Format: "MM/DD/YYYY HH:00"
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

        // First pass: Determine annual maximums
        const annualMaxMap = new Map();
        let totalDuration = 0;

        try {
            // Process data and find annual maximums
            this.IETDData.forEach(data => {
                if (!Array.isArray(data) || data.length < 4) return;

                const [datefrom, dateto, hpcpsum] = data;

                if (!datefrom || !dateto || typeof hpcpsum !== 'number') return;

                const fromDate = new Date(datefrom);
                const year = fromDate.getFullYear();

                if (isNaN(year)) return;

                const duration = new Date(dateto) - fromDate;
                if (duration <= 0) return;

                if (!annualMaxMap.has(year) || annualMaxMap.get(year).volume < hpcpsum) {
                    if (annualMaxMap.has(year)) {
                        totalDuration -= annualMaxMap.get(year).duration;
                    }
                    totalDuration += duration;
                    annualMaxMap.set(year, {
                        from: datefrom,
                        to: dateto,
                        volume: hpcpsum,
                        duration: duration
                    });
                }
            });

            // Format data for D3
            this.formattedData = Array.from(annualMaxMap, ([year, values]) => {
                const duration_ratio = totalDuration > 0 ? values.duration / totalDuration : 0;
                return {
                    year: parseInt(year),
                    period: `${this.timeFormat(values.from)} ~ ${this.timeFormat(values.to)}`,
                    from: values.from,
                    to: values.to,
                    duration: values.duration,
                    duration_ratio: isFinite(duration_ratio) ? duration_ratio : 0,
                    volume: values.volume
                };
            }).sort((a, b) => a.year - b.year);

        } catch (error) {
            console.error('Error processing precipitation data:', error);
            return null;
        }
    }

    calculateAlpha(values, innerWidth) {
        const n = values.length;
        const total = 1;
        return (innerWidth - (n - 1) * this.innerPadding * innerWidth / n -
            2 * this.outerPadding * innerWidth / n) / total;
    }

    calculateMidi(values, alpha, innerWidth) {
        const w = (i) => values[i].duration_ratio * alpha;
        const n = values.length;

        return (_, i) => {
            const op = this.outerPadding * innerWidth / n;
            const p = this.innerPadding * innerWidth / n;
            const sum = d3.sum(values.slice(0, i), d => d.duration_ratio);
            return op + sum * alpha + i * p + w(i) / 2;
        };
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

        // Create SVG
        this.createSvg();

        // Create scales and axes
        this.createScales();
        this.createAxes();

        // Create the visualization
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

        // Create tooltip
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
            .domain(this.formattedData.map(d => d.year));

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
            .attr("dy", ".75em");

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
            .attr("x", d => this.margin.left + this.xScale(d.year) - this.alpha * d.duration_ratio / 2)
            .attr("y", d => this.margin.top + this.yScale(d.volume))
            .attr("width", d => this.alpha * d.duration_ratio)
            .attr("height", d => this.innerHeight - this.yScale(d.volume))
            .attr("fill", "steelblue")
            .on("mouseover", (event, d) => this.handleMouseOver(event, d))
            .on("mouseout", (event, d) => this.handleMouseOut(event, d))
            .on("click", (event, d) => this.handleClick(event, d));

        // Add labels
        this.createLabels();

        // Add title and axes labels
        this.createTitles();
    }

    getTextWidth(text, font) {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        context.font = font;
        return context.measureText(text).width;
    }

    createLabels() {
        this.labelBar = this.svg.selectAll(".bar-label")
            .data(this.formattedData)
            .enter()
            .append("text")
            .attr("class", "bar-label")
            .text(d => d.volume.toFixed(2))
            .attr("x", d => this.margin.left + this.xScale(d.year))
            .attr("y", d => this.margin.top * 1.5 + this.yScale(d.volume))
            .attr("font-family", "Arial")
            .attr("font-size", "9px")
            .attr("text-anchor", "middle")
            .attr("fill", "#ffffff")
            .style("display", d => {
                // Get the width of the bar
                const barWidth = this.alpha * d.duration_ratio;
                // Get the width of the text
                const textWidth = this.getTextWidth(d.volume.toFixed(2), "9px Arial");
                // Only show label if bar is wide enough (adding some padding)
                return barWidth > (textWidth + 4) ? "block" : "none";
            });
    }

    createTitles() {
        this.chartTitle = this.svg.append("text")
            .attr("class", "title annual-max")
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

        // Process overlaps
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
        //         HPCP: ${d.volume.toFixed(2)}<br/>
        //         Duration: ${(d.duration / 1000 / 60 / 60).toFixed(0)} hours
        //     </div>`)
        //     .style("visibility", "visible")
        //     .style("top", (event.pageY - this.tooltip.node().offsetHeight - 20) + "px")
        //     .style("left", event.pageX + "px");


        // Get mouse position relative to the chart container
        // Determine if mouse is in right half of chart
        const isRightHalf = (event.clientX - this.svg.node().getBoundingClientRect().left) > this.innerWidth / 2;

        // Get tooltip element to calculate its width
        const tooltipNode = this.tooltip.node();
        const tooltipWidth = tooltipNode ? tooltipNode.getBoundingClientRect().width : 150; // 150px as fallback

        this.tooltip
            .html(
                this.createTooltipFormat(d,
                `<span style="color:blue">${d.period}</span><br/>
                HPCP: ${d.volume.toFixed(2)}<br/>
                Duration: ${(d.duration / 1000 / 60 / 60).toFixed(0)} hours`)
            )
            .style("visibility", "visible")
            .style("top", (event.pageY - this.tooltip.node().offsetHeight - 20) + "px")
            .style("left", isRightHalf ?
                (event.pageX - tooltipWidth - 10) + "px" : // Left of cursor if on right half
                (event.pageX + 10) + "px");               // Right of cursor if on left half
    }

    handleMouseOut(event, d) {
        if (typeof removeHighlights_in_allHighcharts === 'function') {
            removeHighlights_in_allHighcharts();
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

        // Recalculate layout parameters
        this.alpha = this.calculateAlpha(this.formattedData, this.innerWidth);
        this.mid = this.calculateMidi(this.formattedData, this.alpha, this.innerWidth);

        // Update SVG width
        this.svg.attr("width", this.width);

        // Update scales
        this.xScale.range(this.formattedData.map(this.mid));

        // Update x-axis with transition
        this.svg.select(".x.axis")
            .transition()
            .duration(500)
            .call(d3.axisBottom(this.xScale))
            .on("end", () => {
                // Apply deduping after transition
                this.dedupeLabels(this.svg.select(".x.axis").selectAll(".tick text"));
            });

        // Update bars
        this.bars.transition()
            .duration(500)
            .attr("x", d => this.margin.left + this.xScale(d.year) - this.alpha * d.duration_ratio / 2)
            .attr("width", d => this.alpha * d.duration_ratio);

        this.labelBar
            .attr("x", d => this.margin.left + this.xScale(d.year))
            .style("display", d => {
                const barWidth = this.alpha * d.duration_ratio;
                const textWidth = this.getTextWidth(d.volume.toFixed(2), "9px Arial");
                return barWidth > (textWidth + 4) ? "block" : "none";
            });

        // Update title position
        this.chartTitle
            .attr("x", this.margin.left + this.innerWidth/2);
    }

    async updateData(newIETDData, newIETDHour) {
        this.IETDData = newIETDData;
        this.IETDhour = newIETDHour;

        // Reprocess data
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

        if (hasZeroElement || this.formattedData.length < 2) {
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

        // Recalculate layout parameters
        this.alpha = this.calculateAlpha(this.formattedData, this.innerWidth);
        this.mid = this.calculateMidi(this.formattedData, this.alpha, this.innerWidth);

        // Update scales
        this.createScales();

        // Clear all existing elements first
        this.svg.selectAll(".bar").remove();
        this.svg.selectAll(".bar-label").remove();

        // Update x-axis with transition
        if (this.formattedData.length > 1) {
            // Update x-axis with transition for multiple items
            this.svg.select(".x.axis")
                .transition()
                .duration(750)
                .call(d3.axisBottom(this.xScale))
                .on("end", () => {
                    this.dedupeLabels(this.svg.select(".x.axis").selectAll(".tick text"));
                });
        } else {
            // Update x-axis without transition for single item
            this.svg.select(".x.axis")
                .call(d3.axisBottom(this.xScale));
        }

        // Update y-axis
        if (this.formattedData.length > 1) {
            this.yAxis.transition()
                .duration(750)
                .call(d3.axisLeft(this.yScale).ticks(3)
                    .tickFormat(d => d3.format("")(d)));
        } else {
            this.yAxis.call(d3.axisLeft(this.yScale).ticks(3)
                    .tickFormat(d => d3.format("")(d)));
        }

        // Add new bars
        this.bars = this.svg.selectAll(".bar")
            .data(this.formattedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("data-indicator", d => d.period)
            .attr("x", d => this.margin.left + this.xScale(d.year) - this.alpha * d.duration_ratio / 2)
            .attr("y", d => this.margin.top + this.yScale(d.volume))
            .attr("width", d => this.alpha * d.duration_ratio)
            .attr("height", d => this.innerHeight - this.yScale(d.volume))
            .attr("fill", "steelblue")
            .on("mouseover", (event, d) => this.handleMouseOver(event, d))
            .on("mouseout", (event, d) => this.handleMouseOut(event, d))
            .on("click", (event, d) => this.handleClick(event, d));

        // Add new labels
        this.labelBar = this.svg.selectAll(".bar-label")
            .data(this.formattedData)
            .enter()
            .append("text")
            .attr("class", "bar-label")
            .text(d => d.volume.toFixed(2))
            .attr("x", d => this.margin.left + this.xScale(d.year))
            .attr("y", d => this.margin.top * 1.5 + this.yScale(d.volume))
            .attr("font-family", "Arial")
            .attr("font-size", "9px")
            .attr("text-anchor", "middle")
            .attr("fill", "#ffffff")
            .style("display", d => {
                const barWidth = this.alpha * d.duration_ratio;
                const textWidth = this.getTextWidth(d.volume.toFixed(2), "9px Arial");
                return barWidth > (textWidth + 4) ? "block" : "none";
            });

        // Update title
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
            container.selectAll(".annual-max").remove();
            container.selectAll(".no-data-message").remove();

            // Remove all event listeners from bars
            container.selectAll(".bar")
                .on("mouseover", null)
                .on("mouseout", null)
                .on("click", null);

            // Clear all data references
            this.formattedData = null;
            this.IETDData = null;
            this.IETDhour = null;
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

            // Clear any temporary canvas elements created for text measurements
            const tempCanvas = document.querySelector('canvas');
            if (tempCanvas) tempCanvas.remove();

            // Call parent's destroy method
            super.destroy();

        } catch (error) {
            console.error('Error in destroy:', error);
        }
    }
}

