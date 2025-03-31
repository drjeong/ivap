class TopTenLargestPrecipitationPlot extends ChartCommons{
    constructor(containerId, IETDhour, IETDData) {
        super(containerId);
        this.containerId = containerId;
        this.IETDhour = IETDhour;
        this.IETDData = IETDData;
        this.margin = { top: 20, right: 20, bottom: 50, left: 60 };
        this.title = "Ten Largest Precipitation (Volume)";
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

    formatTenLargestPrecipitationEvents(topTenEvents) {
        let totalDuration = 0;

        // First calculate total duration with validation
        topTenEvents.forEach(event => {
            if (event && Array.isArray(event) && event.length >= 2) {
                const fromDate = new Date(event[0]);
                const toDate = new Date(event[1]);

                if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
                    const duration = toDate - fromDate;
                    totalDuration += duration;
                }
            }
        });

        // Handle case where totalDuration is 0 or NaN
        if (totalDuration <= 0 || isNaN(totalDuration)) {
            console.warn('Invalid total duration detected, using default value');
            totalDuration = 1; // prevent division by zero
        }

        // Format the data with duration ratios and validation
        return topTenEvents.map((event, index) => {
            if (!event || !Array.isArray(event) || event.length < 3) {
                console.warn(`Invalid event data at index ${index}`);
                return {
                    label: `Event ${index + 1}`,
                    period: 'Invalid Period',
                    from: null,
                    to: null,
                    duration: 0,
                    duration_ratio: 0,
                    volume: 0
                };
            }

            const fromDate = new Date(event[0]);
            const toDate = new Date(event[1]);
            const volume = Number(event[2]);

            // Validate dates and volume
            if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || isNaN(volume)) {
                console.warn(`Invalid date or volume data at index ${index}`);
                return {
                    label: `Event ${index + 1}`,
                    period: 'Invalid Period',
                    from: null,
                    to: null,
                    duration: 0,
                    duration_ratio: 0,
                    volume: 0
                };
            }

            const duration = toDate - fromDate;
            const duration_ratio = duration / totalDuration;

            return {
                label: this.xAxisLabelFormat(fromDate),
                period: `${this.timeFormat(fromDate)} ~ ${this.timeFormat(toDate)}`,
                from: event[0],
                to: event[1],
                duration: duration,
                duration_ratio: isNaN(duration_ratio) ? 0 : duration_ratio,
                volume: isNaN(volume) ? 0 : volume
            };
        });
    }

    processData() {
        // Sort and get top 10 events
        const sortedData = Array.from(this.IETDData)
            .sort((e1, e2) => e2[2] - e1[2])
            .slice(0, 10);

        // Format data using the new method
        this.formattedData = this.formatTenLargestPrecipitationEvents(sortedData);
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

    // For x-axis label formatting
    xAxisLabelFormat(date) {
        if (!date) return '';
        try {
            const d = new Date(date);

            // Format: "YYYY Month"
            const year = d.getFullYear();
            // Get month name
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
            const month = months[d.getMonth()];
            const day = d.getDate().toString().padStart(2, '0');
            const hour = d.getHours().toString().padStart(2, '0');

            return `${year} ${month} ${day} ${hour}h`;
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
            .attr("x", d => this.margin.left + this.xScale(d.label))
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
    }

    createTitles() {
        this.chartTitle = this.svg.append("text")
            .attr("class", "title toptenlargest")
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
        //     .style("left", (() => {
        //         let leftpos = event.pageX;
        //         if (leftpos > this.innerWidth) {
        //             leftpos = leftpos - this.tooltip.node().offsetWidth;
        //         }
        //         return leftpos + "px";
        //     })());


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
                Duration: ${(d.duration / 1000 / 60 / 60).toFixed(0)} hours
            `))
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

        // Update x-axis with new labels
        this.svg.select(".x.axis")
            .transition()
            .duration(500)
            .call(d3.axisBottom(this.xScale))
            .selectAll("text")
            .style("text-anchor", "middle")
            .attr("dy", ".75em")
            .attr("transform", "translate(0,0)")
            .on("end", () => {
                // Apply deduping after transition
                this.dedupeLabels(this.svg.select(".x.axis").selectAll(".tick text"));
            });

        // Update bars
        this.bars.transition()
            .duration(500)
            .attr("x", d => this.margin.left + this.xScale(d.label) - this.alpha * d.duration_ratio / 2)
            .attr("width", d => this.alpha * d.duration_ratio);

        // Update labels
        this.labelBar
            .attr("x", d => this.margin.left + this.xScale(d.label))
            .style("display", d => {
                const barWidth = this.alpha * d.duration_ratio;
                const textWidth = this.getTextWidth(d.volume.toFixed(2), "9px Arial");
                return barWidth > (textWidth + 4) ? "block" : "none";
            });

        // Update title position
        this.chartTitle
            .attr("x", this.margin.left + this.innerWidth/2);
    }

    // this.IETDData = newIETDData;


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

        // Recalculate layout parameters
        this.alpha = this.calculateAlpha(this.formattedData, this.innerWidth);
        this.mid = this.calculateMidi(this.formattedData, this.alpha, this.innerWidth);

        // Update scales using existing method
        this.createScales();

        // Update bars with transition
        // Use period as the key function for proper data binding
        this.bars = this.svg.selectAll(".bar")
            .data(this.formattedData, d => d.period);

        // Remove old bars
        this.bars.exit().remove();

        // Update existing bars
        this.bars.transition()
            .duration(750)
            .attr("x", d => this.margin.left + this.xScale(d.label) - this.alpha * d.duration_ratio / 2)
            .attr("y", d => this.margin.top + this.yScale(d.volume))
            .attr("width", d => this.alpha * d.duration_ratio)
            .attr("height", d => this.innerHeight - this.yScale(d.volume));

        // Add new bars
        const newBars = this.bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => this.margin.left + this.xScale(d.label) - this.alpha * d.duration_ratio / 2)
            .attr("y", d => this.margin.top + this.yScale(d.volume))
            .attr("width", d => this.alpha * d.duration_ratio)
            .attr("height", d => this.innerHeight - this.yScale(d.volume))
            .attr("fill", "steelblue");

        // Merge the selections and update event handlers
        this.bars = newBars.merge(this.bars);

        // Clear existing event handlers and reapply
        this.bars
            .attr("data-indicator", d => d.period)
            .on("mouseover", (event, d) => this.handleMouseOver(event, d))
            .on("mouseout", (event, d) => this.handleMouseOut(event, d));

        // Update labels
        this.labelBar = this.svg.selectAll(".bar-label")
            .data(this.formattedData, d => d.period);

        this.labelBar.exit().remove();

        this.labelBar.transition()
            .duration(750)
            .attr("x", d => this.margin.left + this.xScale(d.label))
            .attr("y", d => this.margin.top * 1.5 + this.yScale(d.volume))
            .text(d => d.volume.toFixed(2))
            .style("display", d => {
                const barWidth = this.alpha * d.duration_ratio;
                const textWidth = this.getTextWidth(d.volume.toFixed(2), "9px Arial");
                return barWidth > (textWidth + 4) ? "block" : "none";
            });

        const newLabels = this.labelBar.enter()
            .append("text")
            .attr("class", "bar-label")
            .attr("x", d => this.margin.left + this.xScale(d.label))
            .attr("y", d => this.margin.top * 1.5 + this.yScale(d.volume))
            .attr("text-anchor", "middle")
            .attr("font-family", "Arial")
            .attr("font-size", "9px")
            .attr("fill", "#ffffff")
            .text(d => d.volume.toFixed(2))
            .style("display", d => {
                const barWidth = this.alpha * d.duration_ratio;
                const textWidth = this.getTextWidth(d.volume.toFixed(2), "9px Arial");
                return barWidth > (textWidth + 4) ? "block" : "none";
            });

        this.labelBar = newLabels.merge(this.labelBar);

        // Update axes
        this.svg.select(".x.axis")
            .transition()
            .duration(750)
            .call(d3.axisBottom(this.xScale))
            .selectAll("text")
            .style("text-anchor", "middle")
            .attr("dy", ".75em")
            .attr("transform", "translate(0,0)")
            .on("end", () => {
                // Apply deduping after transition
                this.dedupeLabels(this.svg.select(".x.axis").selectAll(".tick text"));
            });

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
            container.selectAll(".toptenlargest").remove();
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
