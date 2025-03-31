class ExceedanceProbabilityPlot extends ChartCommons{
    constructor(containerId, IETDhour, IETDData) {
        super(containerId);
        this.containerId = containerId;
        this.IETDhour = IETDhour;
        this.IETDData = IETDData;
        this.margin = { top: 20, right: 20, bottom: 50, left: 60 };
        this.title = "Exceedance Probability Plot";

        // Bind methods
        this.resize = this.resize.bind(this);
        this.processData = this.processData.bind(this);

        // Initialize
        this.processData();
        this.initialize();
    }

    processData() {
        if (!Array.isArray(this.IETDData) || this.IETDData.length === 0) {
            console.error('Invalid or empty IETDData');
            return;
        }

        try {
            // Extract volumes and sort them in descending order
            const volumes = this.IETDData.map(data => data[2]).sort((a, b) => b - a);
            const n = volumes.length;

            // Calculate exceedance probabilities
            this.formattedData = volumes.map((volume, index) => {
                const exceedanceProb = ((index + 1) / (n + 1)) * 100;
                return {
                    volume: volume,
                    probability: exceedanceProb
                };
            });

        } catch (error) {
            console.error('Error processing data:', error);
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
        // X-axis: Probability (%)
        this.xScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, this.innerWidth]);

        // Y-axis: Volume (log scale)
        const maxVolume = d3.max(this.formattedData, d => d.volume);
        this.yScale = d3.scaleSymlog()
            .domain([d3.min(this.formattedData, d => d.volume) * 0.9, maxVolume * 1.1])
            .range([this.innerHeight, 0]);
    }

    createAxes() {
        // X-axis
        const xAxis = d3.axisBottom(this.xScale)
            .tickFormat(d => d + "%");

        this.xAxis = this.svg.append("g")
            .attr("class", "x axis")
            .attr("color", "black")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top + this.innerHeight})`)
            .call(xAxis);

        // Y-axis
        this.yAxis = this.svg.append("g")
            .attr("class", "y axis")
            .attr("color", "black")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`)
            .call(d3.axisLeft(this.yScale)
                .tickFormat(d => d.toFixed(2)));

        // Apply deduplication to y-axis labels
        this.dedupeYAxisLabels(this.svg.select(".y.axis").selectAll(".tick text"));
    }

    dedupeYAxisLabels(labels) {
        // Get all labels and their positions
        const labelData = [];
        labels.each(function(d, i) {
            const bbox = this.getBoundingClientRect();
            labelData.push({
                index: i,
                top: bbox.top,
                bottom: bbox.bottom,
                height: bbox.height,
                element: this,
                value: d
            });
        });

        // Sort labels by position from top to bottom
        labelData.sort((a, b) => a.top - b.top);

        // Add small buffer to prevent near-overlaps
        const buffer = 2;

        // Make first label visible
        let lastVisibleLabel = labelData[0];
        d3.select(lastVisibleLabel.element)
            .style("opacity", 1);

        // Check rest of the labels
        for (let i = 1; i < labelData.length; i++) {
            const currentLabel = labelData[i];

            if (lastVisibleLabel.bottom + buffer > currentLabel.top) {
                d3.select(currentLabel.element)
                    .style("opacity", 0);
            } else {
                d3.select(currentLabel.element)
                    .style("opacity", 1);
                lastVisibleLabel = currentLabel;
            }
        }
    }

    createVisualization() {
        // Create the line
        const line = d3.line()
            .x(d => this.margin.left + this.xScale(d.probability))
            .y(d => this.margin.top + this.yScale(d.volume));

        // Add the line path
        this.svg.append("path")
            .datum(this.formattedData)
            .attr("class", "exceedance-line")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1)
            .attr("d", line);

        // Add data points - Remove white stroke
        this.points = this.svg.selectAll(".exceedance-point")
            .data(this.formattedData)
            .enter()
            .append("circle")
            .attr("class", "exceedance-point")
            .attr("cx", d => this.margin.left + this.xScale(d.probability))
            .attr("cy", d => this.margin.top + this.yScale(d.volume))
            .attr("r", 2)
            .attr("fill", "steelblue")
            // Remove stroke or change to a different color
            .attr("stroke", "steelblue")  // Changed from "white"
            .attr("stroke-width", 1)
            .on("mouseover", (event, d) => this.handleMouseOver(event, d))
            .on("mouseout", (event, d) => this.handleMouseOut(event, d));

        this.createTitles();
    }

    createTitles() {
        this.chartTitle = this.svg.append("text")
            .attr("class", "title")
            .attr("x", this.margin.left + this.innerWidth/2)
            .attr("y", 15)
            .attr('text-anchor', 'middle')
            .attr("font-family", "Arial")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .text(`${this.title}`);

        // X-axis label
        this.svg.append('text')
            .attr('class', 'x-axis-label')
            .attr('text-anchor', 'middle')
            .attr('x', this.margin.left + this.innerWidth/2)
            .attr('y', this.height - 10)
            .attr("font-size", "12px")
            .attr("font-family", "Arial")
            .text('Exceedance Probability (%)');

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
        // this.tooltip.html(`
        //     <div style="padding: 3px; border-radius: 8px; box-shadow:0 10px 16px 0 rgba(0,0,0,0.2),0 6px 20px 0 rgba(0,0,0,0.19) !important;">
        //         Probability: ${d.probability.toFixed(2)}%<br/>
        //         HPCP: ${d.volume.toFixed(2)} inches
        //     </div>`)
        //     .style("visibility", "visible")
        //     .style("top", (event.pageY - 10) + "px")
        //     .style("left", (event.pageX + 10) + "px");

        this.tooltip
            .html(
                this.createTooltipFormat(d, `
                    Probability: ${d.probability.toFixed(2)}%<br/>
                HPCP: ${d.volume.toFixed(2)} inches
            `))
            .style("visibility", "visible")
            .style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 10) + "px");

        d3.select(event.target)
            .raise() // Brings element to front
            .attr("fill", "#e41a1c")
            .attr("r", 4)
            .attr("stroke-width", 1);
    }

    handleMouseOut(event, d) {
        this.tooltip.style("visibility", "hidden");

        d3.select(event.target)
            .attr("fill", "steelblue")
            .attr("r", 2)
            .attr("stroke-width", 1);
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
                .tickFormat(d => d + "%"));

        // Update line
        const line = d3.line()
            .x(d => this.margin.left + this.xScale(d.probability))
            .y(d => this.margin.top + this.yScale(d.volume));

        this.svg.select(".exceedance-line")
            .transition()
            .duration(500)
            .attr("d", line(this.formattedData));

        // Update points
        this.svg.selectAll(".exceedance-point")
            .transition()
            .duration(500)
            .attr("cx", d => this.margin.left + this.xScale(d.probability))
            .attr("cy", d => this.margin.top + this.yScale(d.volume));

        // Update title position
        this.chartTitle
            .attr("x", this.margin.left + this.innerWidth/2);

        // Update axis labels
        this.svg.select('.x-axis-label')
            .attr('x', this.margin.left + this.innerWidth/2);
    }

    async updateData(newIETDData, newIETDHour) {
        this.IETDData = newIETDData;
        this.IETDhour = newIETDHour;

        this.processData();
        this.createScales();

        // Update axes
        this.svg.select(".x.axis")
            .transition()
            .duration(750)
            .call(d3.axisBottom(this.xScale)
                .tickFormat(d => d + "%"));

        this.svg.select(".y.axis")
            .transition()
            .duration(750)
            .call(d3.axisLeft(this.yScale)
                .tickFormat(d => d.toFixed(2)))
            .on("end", () => {
                requestAnimationFrame(() => {
                    this.dedupeYAxisLabels(this.svg.select(".y.axis").selectAll(".tick text"));
                });
            });

        // Update line
        const line = d3.line()
            .x(d => this.margin.left + this.xScale(d.probability))
            .y(d => this.margin.top + this.yScale(d.volume));

        this.svg.select(".exceedance-line")
            .datum(this.formattedData)
            .transition()
            .duration(750)
            .attr("d", line);

        // Update points
        const points = this.svg.selectAll(".exceedance-point")
            .data(this.formattedData);

        points.exit().remove();

        points.transition()
            .duration(750)
            .attr("cx", d => this.margin.left + this.xScale(d.probability))
            .attr("cy", d => this.margin.top + this.yScale(d.volume));

        points.enter()
            .append("circle")
            .attr("class", "exceedance-point")
            .attr("r", 2)
            .attr("fill", "steelblue")
            .attr("stroke", "steelblue")  // Changed from "white"
            .attr("stroke-width", 1)
            .attr("cx", d => this.margin.left + this.xScale(d.probability))
            .attr("cy", d => this.margin.top + this.yScale(d.volume))
            .on("mouseover", (event, d) => this.handleMouseOver(event, d))
            .on("mouseout", (event, d) => this.handleMouseOut(event, d));

        // Update title
        this.chartTitle
            .text(`${this.title}`);
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
            container.selectAll(".exceedance-line").remove();
            container.selectAll(".exceedance-point").remove();
            container.selectAll(".x.axis").remove();
            container.selectAll(".y.axis").remove();
            container.selectAll(".title").remove();
            container.selectAll(".x-axis-label").remove();
            container.selectAll(".y-axis-label").remove();

            // Remove all event listeners from points
            container.selectAll(".exceedance-point")
                .on("mouseover", null)
                .on("mouseout", null);

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
            this.points = null;
            this.chartTitle = null;
            this.width = null;
            this.height = null;
            this.innerWidth = null;
            this.innerHeight = null;
            this.margin = null;

            // Call parent's destroy method
            super.destroy();

        } catch (error) {
            console.error('Error in destroy:', error);
        }
    }
}